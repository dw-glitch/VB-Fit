create function public.save_workout_plan(payload jsonb,start_session_id uuid default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare row jsonb; template_ids uuid[]:='{}'; tid uuid; sid uuid;
begin
 if auth.uid() is null then raise exception 'Acesso negado'; end if;
 if payload is null or jsonb_typeof(payload)<>'array' then raise exception 'Plano inválido';end if;
 if jsonb_array_length(payload)<1 or jsonb_array_length(payload)>6 then raise exception 'O plano deve conter de 1 a 6 fichas';end if;
 for row in select * from jsonb_array_elements(payload) loop
  if row->>'id' is null then raise exception 'Identificador da ficha ausente';end if;
  if jsonb_typeof(row->'exercises') is distinct from 'array' then raise exception 'Exercícios ausentes';end if;
  if jsonb_array_length(row->'exercises')<1 or jsonb_array_length(row->'exercises')>10 then raise exception 'Quantidade de exercícios inválida';end if;
  tid:=public.save_workout(row);
  template_ids:=array_append(template_ids,tid);
 end loop;
 if start_session_id is not null then
  sid:=public.start_workout(start_session_id,template_ids[1],null);
 end if;
 return jsonb_build_object('template_ids',to_jsonb(template_ids),'session_id',sid);
end $$;
revoke all on function public.save_workout_plan(jsonb,uuid) from public,anon;
grant execute on function public.save_workout_plan(jsonb,uuid) to authenticated;
