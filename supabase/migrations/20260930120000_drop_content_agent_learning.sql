-- Content agent removed: drop learning/feedback table (idempotent)
drop table if exists public.agent_suggestion_feedback cascade;
