-- Content agent removed: drop learning/feedback table
drop policy if exists "Staff manage agent feedback" on public.agent_suggestion_feedback;

drop table if exists public.agent_suggestion_feedback;
