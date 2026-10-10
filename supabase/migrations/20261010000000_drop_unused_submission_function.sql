-- The app is local-first: all submission state lives in localStorage and the
-- /api/submissions route that used to call this RPC was never invoked by the
-- client. The function was also incomplete (its free-tier limit check was
-- computed but never enforced), so it is removed entirely.
--
-- This migration is a no-op on fresh databases (the definition was already
-- removed from 20261008000000_init.sql); it cleans up databases where that
-- migration ran before the function was dropped.
drop function if exists public.record_submission_transition(uuid, text, text, text, text, boolean);
