-- The platform-created DDL event trigger does not need to be callable through the API.
revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
create policy invites_deny_direct on private.couple_invites for all to authenticated using(false) with check(false);
revoke update on public.couple_goals from authenticated;
grant update(title,target,progress) on public.couple_goals to authenticated;
alter table public.workout_sessions drop constraint workout_sessions_template_id_fkey;
alter table public.workout_sessions add constraint workout_sessions_template_owner_fk foreign key(template_id,user_id) references public.workout_templates(id,user_id) on delete set null (template_id);
create index planned_template_idx on public.planned_exercises(template_id);
create index session_template_idx on public.workout_sessions(template_id);
create index session_exercises_session_idx on public.session_exercises(session_id);
create index planned_catalog_idx on public.planned_exercises(exercise_id);
create index session_catalog_idx on public.session_exercises(exercise_id);
create index invites_owner_idx on private.couple_invites(owner_id);
