-- Supabase Schema Migration: Auth OTP Codes (email sign-up verification)
-- Prepared: 9 October 2026
--
-- Replaces Supabase Auth's built-in email delivery (which 504s when SMTP
-- is misconfigured) with app-managed OTP codes sent through the Resend API.
-- Codes are stored as SHA-256 hashes with rate limiting and attempt locks,
-- enforced atomically inside SECURITY DEFINER functions (service-role only).

-- 7. AUTH OTP CODES
create table if not exists public.auth_otp_codes (
  email text primary key,
  code_hash text not null,
  attempts int not null default 0,
  sent_count int not null default 0,
  window_started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.auth_otp_codes enable row level security;
-- No policies: only the service role (which bypasses RLS) can access.

create index if not exists idx_otp_codes_expires on public.auth_otp_codes(expires_at);

-- Function: atomically store a new OTP code + enforce send rate limit
-- (max 3 codes per email per 60 seconds)
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

  select * into v_row from public.auth_otp_codes where email = v_email for update;

  if found and v_row.window_started_at > v_now - interval '1 minute' then
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
  returning * into v_row;

  return jsonb_build_object('ok', true, 'expires_at', v_row.expires_at);
end;
$$;

-- Function: verify a code (constant-time-ish hash compare handled by caller)
-- with attempt tracking: 5 wrong attempts invalidate the code
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
begin
  select * into v_row from public.auth_otp_codes where email = v_email for update;

  if not found or v_row.code_hash is null or v_row.code_hash = '' then
    return jsonb_build_object('status', 'missing');
  end if;

  if v_row.expires_at <= now() then
    update public.auth_otp_codes
      set code_hash = '', attempts = 0, updated_at = now()
      where email = v_email;
    return jsonb_build_object('status', 'expired');
  end if;

  if v_row.attempts >= 5 then
    return jsonb_build_object('status', 'locked');
  end if;

  if v_row.code_hash <> p_code_hash then
    update public.auth_otp_codes
      set attempts = attempts + 1, updated_at = now()
      where email = v_email;
    if v_row.attempts + 1 >= 5 then
      update public.auth_otp_codes set code_hash = '' where email = v_email;
      return jsonb_build_object('status', 'locked');
    end if;
    return jsonb_build_object(
      'status', 'mismatch',
      'remaining', 5 - (v_row.attempts + 1)
    );
  end if;

  return jsonb_build_object('status', 'ok');
end;
$$;

-- Function: consume (invalidate) a code after successful verification
create or replace function public.consume_auth_otp(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.auth_otp_codes
    set code_hash = '', attempts = 0, updated_at = now()
    where email = lower(trim(p_email));
end;
$$;

-- Lock functions down to the service role only
revoke execute on function public.create_auth_otp(text, text, int) from public, anon, authenticated;
revoke execute on function public.verify_auth_otp(text, text) from public, anon, authenticated;
revoke execute on function public.consume_auth_otp(text) from public, anon, authenticated;
grant execute on function public.create_auth_otp(text, text, int) to service_role;
grant execute on function public.verify_auth_otp(text, text) to service_role;
grant execute on function public.consume_auth_otp(text) to service_role;
