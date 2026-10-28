-- Supabase Schema Migration: harden auth OTP codes
-- Prepared: 28 October 2026
--
-- Fixes found in the QA pass:
--   * Requesting a new code reset the wrong-guess counter, allowing ~15
--     guesses/minute per email. Failed guesses are now also counted per email
--     over a rolling hour (max 10) and survive new codes.
--   * verify_auth_otp left the code valid after success, so two parallel
--     requests could both pass. A successful verify now clears the code
--     atomically.
--   * `for update` on a missing row locks nothing, so a burst for a new email
--     bypassed the 3-per-minute send limit. Sends are now serialized per email
--     with an advisory lock.
--   * Expired rows were never purged.

alter table public.auth_otp_codes
  add column if not exists fail_count int not null default 0,
  add column if not exists fail_window_started_at timestamptz;

create or replace function public.create_auth_otp(
  p_email text,
  p_code_hash text,
  p_ttl_seconds int default 600
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_row public.auth_otp_codes;
  v_now timestamptz := now();
  v_sent int := 1;
  v_window timestamptz := v_now;
  v_retry int;
begin
  if p_code_hash is null or length(p_code_hash) < 32 then
    return jsonb_build_object('ok', false, 'error', 'Invalid code hash');
  end if;

  perform pg_advisory_xact_lock(hashtext(v_email));

  delete from public.auth_otp_codes where expires_at < v_now - interval '1 day';

  select * into v_row from public.auth_otp_codes where email = v_email;

  if found then
    -- Too many wrong guesses in the last hour: refuse new codes for a while.
    if v_row.fail_count >= 10
       and v_row.fail_window_started_at > v_now - interval '1 hour' then
      v_retry := ceil(extract(epoch from (v_row.fail_window_started_at + interval '1 hour' - v_now)))::int;
      return jsonb_build_object(
        'ok', false,
        'error', 'Too many failed attempts. Try again later.',
        'retry_after', greatest(v_retry, 1)
      );
    end if;

    if v_row.window_started_at > v_now - interval '1 minute' then
      if v_row.sent_count >= 3 then
        v_retry := ceil(extract(epoch from (v_row.window_started_at + interval '1 minute' - v_now)))::int;
        return jsonb_build_object(
          'ok', false,
          'error', 'Rate limit exceeded. Try again in ' || greatest(v_retry, 1) || ' seconds',
          'retry_after', greatest(v_retry, 1)
        );
      end if;
      v_sent := v_row.sent_count + 1;
      v_window := v_row.window_started_at;
    end if;
  end if;

  insert into public.auth_otp_codes (
    email, code_hash, attempts, sent_count, window_started_at, expires_at, updated_at
  )
  values (v_email, p_code_hash, 0, v_sent, v_window, v_now + make_interval(secs => p_ttl_seconds), v_now)
  on conflict (email) do update set
    code_hash = excluded.code_hash,
    attempts = 0,
    sent_count = excluded.sent_count,
    window_started_at = excluded.window_started_at,
    expires_at = excluded.expires_at,
    updated_at = excluded.updated_at
    -- fail_count / fail_window_started_at are intentionally preserved.
  returning * into v_row;

  return jsonb_build_object('ok', true, 'expires_at', v_row.expires_at);
end;
$$;

create or replace function public.verify_auth_otp(
  p_email text,
  p_code_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_row public.auth_otp_codes;
  v_now timestamptz := now();
  v_fails int;
  v_fail_window timestamptz;
begin
  select * into v_row from public.auth_otp_codes where email = v_email for update;

  if not found or v_row.code_hash is null or v_row.code_hash = '' then
    return jsonb_build_object('status', 'missing');
  end if;

  if v_row.expires_at <= v_now then
    update public.auth_otp_codes
      set code_hash = '', attempts = 0, updated_at = v_now
      where email = v_email;
    return jsonb_build_object('status', 'expired');
  end if;

  if v_row.attempts >= 5
     or (v_row.fail_count >= 10 and v_row.fail_window_started_at > v_now - interval '1 hour') then
    return jsonb_build_object('status', 'locked');
  end if;

  if v_row.code_hash <> p_code_hash then
    if v_row.fail_window_started_at is null
       or v_row.fail_window_started_at <= v_now - interval '1 hour' then
      v_fails := 1;
      v_fail_window := v_now;
    else
      v_fails := v_row.fail_count + 1;
      v_fail_window := v_row.fail_window_started_at;
    end if;

    update public.auth_otp_codes
      set attempts = attempts + 1,
          fail_count = v_fails,
          fail_window_started_at = v_fail_window,
          updated_at = v_now
      where email = v_email;

    if v_row.attempts + 1 >= 5 or v_fails >= 10 then
      update public.auth_otp_codes set code_hash = '' where email = v_email;
      return jsonb_build_object('status', 'locked');
    end if;
    return jsonb_build_object(
      'status', 'mismatch',
      'remaining', 5 - (v_row.attempts + 1)
    );
  end if;

  -- Success: clear the code in the same transaction so it can only be used once.
  update public.auth_otp_codes
    set code_hash = '', attempts = 0, fail_count = 0, fail_window_started_at = null, updated_at = v_now
    where email = v_email;

  return jsonb_build_object('status', 'ok');
end;
$$;

revoke execute on function public.create_auth_otp(text, text, int) from public, anon, authenticated;
revoke execute on function public.verify_auth_otp(text, text) from public, anon, authenticated;
grant execute on function public.create_auth_otp(text, text, int) to service_role;
grant execute on function public.verify_auth_otp(text, text) to service_role;
