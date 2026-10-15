begin;
select set_config('test.plan_owner',gen_random_uuid()::text,true),set_config('test.plan_other',gen_random_uuid()::text,true),set_config('test.plan_a',gen_random_uuid()::text,true),set_config('test.plan_b',gen_random_uuid()::text,true),set_config('test.plan_session',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role,email,email_confirmed_at,created_at,updated_at)
select id,'authenticated','authenticated','vbfit-plan-'||id||'@example.invalid',now(),now(),now()
from (values(current_setting('test.plan_owner')::uuid),(current_setting('test.plan_other')::uuid)) as users(id);
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.plan_owner'),'role','authenticated')::text,true);
do $$
declare a jsonb; b jsonb; batch jsonb; result jsonb; third uuid:=gen_random_uuid();
begin
 a:=jsonb_build_object('id',current_setting('test.plan_a'),'name','QA automático A','days','[1]'::jsonb,'scheduled_time','18:30','exercises','[{"exercise_id":"supino","position":0,"sets":2,"reps_min":8,"reps_max":12,"rest_seconds":90}]'::jsonb);
 b:=jsonb_build_object('id',current_setting('test.plan_b'),'name','QA automático B','days','[3]'::jsonb,'scheduled_time','18:30','exercises','[{"exercise_id":"legpress","position":0,"sets":2,"reps_min":8,"reps_max":12,"rest_seconds":90}]'::jsonb);
 batch:=jsonb_build_array(a,b);
 result:=public.save_workout_plan(batch,current_setting('test.plan_session')::uuid);
 if jsonb_array_length(result->'template_ids')<>2 or (result->>'session_id')::uuid<>current_setting('test.plan_session')::uuid then raise exception 'FAIL plan response';end if;
 if (select count(*) from public.workout_templates)<>2 or (select count(*) from public.workout_sessions)<>1 or (select count(*) from public.session_exercises)<>1 then raise exception 'FAIL plan or snapshot missing';end if;
 perform public.save_workout_plan(batch,current_setting('test.plan_session')::uuid);
 if (select count(*) from public.workout_templates)<>2 or (select count(*) from public.workout_sessions)<>1 then raise exception 'FAIL duplicate plan retry';end if;
 begin
  perform public.save_workout_plan(jsonb_build_array(jsonb_set(a,'{id}',to_jsonb(third::text)),jsonb_set(b,'{exercises,0,exercise_id}','"missing-exercise"')),null);
  raise exception 'FAIL invalid plan accepted';
 exception when foreign_key_violation then null;end;
 if exists(select 1 from public.workout_templates where id=third) then raise exception 'FAIL partial plan persisted';end if;
 begin perform public.save_workout_plan('[]'::jsonb,null);raise exception 'FAIL empty plan';exception when raise_exception then if sqlerrm='FAIL empty plan' then raise;end if;end;
 if has_function_privilege('anon','public.save_workout_plan(jsonb,uuid)','execute') then raise exception 'FAIL anonymous plan execution';end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.plan_other'),'role','authenticated')::text,true);
do $$begin
 if exists(select 1 from public.workout_templates) or exists(select 1 from public.workout_sessions) then raise exception 'FAIL plan privacy';end if;
 begin
  perform public.save_workout_plan(jsonb_build_array(jsonb_build_object('id',current_setting('test.plan_a'),'name','QA forged','days','[1]'::jsonb,'scheduled_time','18:30','exercises','[{"exercise_id":"supino","position":0,"sets":2,"reps_min":8,"reps_max":12,"rest_seconds":90}]'::jsonb)),null);
  raise exception 'FAIL foreign plan overwritten';
 exception when insufficient_privilege then null;end;
end $$;
select 'PASS: atomic generated plan, idempotent retry, start snapshot, RLS, foreign-owner denial, anonymous denial' as result;
rollback;
