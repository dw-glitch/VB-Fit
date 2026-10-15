create schema if not exists private;
create extension if not exists pgcrypto with schema extensions;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
 user_id uuid primary key references auth.users on delete cascade,
 name text not null check(length(name) between 1 and 80), height_cm numeric check(height_cm between 80 and 250),
 goal text not null default '', experience text not null default 'Iniciante', restrictions text[] not null default '{}',
 wake_time time, bedtime time, work_start time, home_time time, friday_home_time time, workout_time time default '18:30',
 duration_minutes int not null default 60 check(duration_minutes between 5 and 240), weekly_target int not null default 4 check(weekly_target between 1 and 7),
 theme text not null default 'system' check(theme in ('light','dark','system')), avatar_path text,
 share_workouts boolean not null default false, share_habits boolean not null default false, share_body boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.exercises(id text primary key,name text not null,muscle text not null,cues text not null,media_url text,media_license text);
insert into public.exercises(id,name,muscle,cues) values
('supino','Supino reto','Peito','Ajuste o banco e a carga com orientação presencial. Mantenha os pés apoiados e controle o movimento.'),
('puxada','Puxada frontal','Costas','Ajuste o apoio das coxas. Puxe à frente do corpo com controle, sem embalar o tronco.'),
('remada','Remada baixa','Costas','Mantenha o tronco estável e evite compensar o movimento com a lombar.'),
('ombros','Desenvolvimento de ombros','Ombros','Escolha uma amplitude confortável e uma carga que permita controle.'),
('triceps','Tríceps na polia','Braços','Mantenha os cotovelos estáveis e controle o retorno.'),
('legpress','Leg press 45°','Pernas','Ajuste o banco com orientação. Preserve o apoio da lombar e não trave os joelhos.'),
('smith','Agachamento no Smith','Pernas','Ajuste os limitadores de segurança e confirme a posição dos pés com o instrutor.'),
('mesa','Mesa flexora','Pernas','Alinhe o eixo da máquina ao joelho e mantenha o quadril apoiado.'),
('pelvica','Elevação pélvica','Glúteos','Mantenha o apoio estável e evite hiperestender a lombar no final do movimento.'),
('panturrilha','Panturrilha','Panturrilhas','Faça o movimento de forma lenta e controlada, sem impulsos.'),
('articulada','Remada articulada','Costas','Ajuste os apoios e mantenha o tronco estável.'),
('inclinado','Supino inclinado com halteres','Peito','Ajuste a inclinação e peça orientação para posicionar os halteres.'),
('neutra','Puxada com pegada neutra','Costas','Mantenha o tronco estável e controle a descida e a volta.'),
('lateral','Elevação lateral','Ombros','Use carga leve o suficiente para não precisar balançar o corpo.'),
('rosca','Rosca direta','Braços','Mantenha os cotovelos próximos ao corpo, sem impulso com o tronco.'),
('stiff','Stiff com halteres','Pernas','Aprenda a dobrar o quadril com orientação e mantenha a coluna em posição confortável.'),
('extensora','Cadeira extensora','Pernas','Alinhe o eixo ao joelho e ajuste o apoio dos tornozelos.'),
('flexora','Cadeira flexora','Pernas','Ajuste encosto, eixo e apoios com o instrutor.'),
('sentado','Panturrilha sentado','Panturrilhas','Ajuste os apoios e faça uma amplitude confortável, sem impulsos.');
create table public.workout_templates (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,
 name text not null check(length(name) between 1 and 100),days int[] not null default '{}',scheduled_time time not null default '18:30',
 archived boolean not null default false,created_at timestamptz not null default now(),unique(id,user_id),check(days <@ array[0,1,2,3,4,5,6])
);
create table public.planned_exercises (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,
 template_id uuid not null,exercise_id text not null references public.exercises,
 position int not null check(position>=0),sets int not null default 4 check(sets between 1 and 12),
 reps_min int not null default 8 check(reps_min between 1 and 100),reps_max int not null default 10 check(reps_max between reps_min and 100),
 rest_seconds int not null default 90 check(rest_seconds between 10 and 600),
 foreign key(template_id,user_id) references public.workout_templates(id,user_id) on delete cascade,unique(id,user_id)
);
create table public.workout_sessions (
 id uuid primary key,user_id uuid not null references auth.users on delete cascade,
 template_id uuid references public.workout_templates on delete set null,name text not null,
 started_at timestamptz not null default now(),finished_at timestamptz,status text not null default 'active' check(status in ('active','completed','interrupted')),
 energy text check(energy in ('Boa','Moderada','Baixa')),notes text not null default '',unique(id,user_id)
);
create unique index one_active_session on public.workout_sessions(user_id) where status='active';
create table public.session_exercises (
 id uuid primary key,user_id uuid not null references auth.users on delete cascade,session_id uuid not null,
 exercise_id text not null references public.exercises,position int not null,sets int not null,reps_min int not null,reps_max int not null,rest_seconds int not null,
 foreign key(session_id,user_id) references public.workout_sessions(id,user_id) on delete cascade,unique(id,user_id)
);
create table public.performed_sets (
 id uuid primary key,user_id uuid not null references auth.users on delete cascade,session_exercise_id uuid not null,
 set_number int not null check(set_number between 1 and 12),weight_kg numeric not null check(weight_kg between 0 and 1500),reps int not null check(reps between 1 and 200),
 completed_at timestamptz not null default now(),foreign key(session_exercise_id,user_id) references public.session_exercises(id,user_id) on delete cascade,
 unique(session_exercise_id,set_number)
);
create table public.meal_plans (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,
 title text not null check(length(title) between 1 and 160),kind text not null default 'Refeição',time time not null,days int[] not null default '{0,1,2,3,4,5,6}',
 ingredients text not null default '',favorite boolean not null default false,work_snack boolean not null default false,
 unique(id,user_id),check(days <@ array[0,1,2,3,4,5,6])
);
create table public.meal_logs (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,meal_id uuid not null,
 day date not null default current_date,carried boolean not null default false,consumed boolean not null default false,
 foreign key(meal_id,user_id) references public.meal_plans(id,user_id) on delete cascade,unique(meal_id,day)
);
create table public.routine_items (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,
 kind text not null check(kind in ('habit','supplement')),name text not null check(length(name) between 1 and 100),
 dose text not null default '',time time not null default '08:00',days int[] not null default '{0,1,2,3,4,5,6}',active boolean not null default true,
 unique(id,user_id),check(days <@ array[0,1,2,3,4,5,6])
);
create table public.routine_logs (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,item_id uuid not null,
 day date not null default current_date,done boolean not null default true,
 foreign key(item_id,user_id) references public.routine_items(id,user_id) on delete cascade,unique(item_id,day)
);
create table public.checkins (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,day date not null,
 sleep_start timestamptz,sleep_end timestamptz,quality int check(quality between 1 and 5),energy text check(energy in ('Boa','Moderada','Baixa')),
 soreness text not null default '',notes text not null default '',unique(user_id,day),check(sleep_end>=sleep_start)
);
create table public.measurements (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,day date not null,
 weight_kg numeric check(weight_kg between 20 and 500),waist_cm numeric check(waist_cm between 30 and 300),hip_cm numeric check(hip_cm between 30 and 300),
 chest_cm numeric check(chest_cm between 30 and 300),arm_cm numeric check(arm_cm between 10 and 100),notes text not null default '',unique(user_id,day)
);
create table public.progress_photos (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,path text not null,day date not null,
 caption text not null default '',check(path like user_id::text||'/%')
);
create table public.reminders (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,title text not null,time time not null,
 days int[] not null default '{0,1,2,3,4,5,6}',enabled boolean not null default true,check(days <@ array[0,1,2,3,4,5,6])
);
create table public.couples (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users on delete cascade,
 partner_id uuid not null references auth.users on delete cascade,created_at timestamptz not null default now(),check(owner_id<>partner_id)
);
create table private.couple_invites (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users on delete cascade,
 token_hash text not null unique,expires_at timestamptz not null default now()+interval '48 hours',used_at timestamptz
);
alter table private.couple_invites enable row level security;
create table public.couple_goals (
 id uuid primary key default gen_random_uuid(),couple_id uuid not null references public.couples on delete cascade,
 author_id uuid not null references auth.users on delete cascade,title text not null check(length(title) between 1 and 150),
 target int not null default 1 check(target between 1 and 1000),progress int not null default 0 check(progress>=0),created_at timestamptz not null default now()
);
create table public.achievements (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,
 couple_id uuid not null references public.couples on delete cascade,message text not null check(length(message) between 1 and 300),created_at timestamptz not null default now()
);
-- Private helper avoids recursive policies. Only evaluates membership of the authenticated caller.
create function private.is_member(cid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.couples where id=cid and auth.uid() in(owner_id,partner_id));
$$;
revoke all on function private.is_member(uuid) from public;
grant execute on function private.is_member(uuid) to authenticated;

do $$ declare t text; begin
 foreach t in array array['profiles','workout_templates','planned_exercises','workout_sessions','session_exercises','performed_sets','meal_plans','meal_logs','routine_items','routine_logs','checkins','measurements','progress_photos','reminders'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 execute format('create policy own_data on public.%I for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t);
 if t<>'profiles' then execute format('create index %I on public.%I(user_id)',t||'_user_idx',t); end if;
 end loop;
end $$;
alter table public.exercises enable row level security;
grant select on public.exercises to authenticated;
revoke all on public.exercises from anon;
create policy read_catalog on public.exercises for select to authenticated using(true);
alter table public.couples enable row level security;
revoke all on public.couples from anon,authenticated;
grant select on public.couples to authenticated;
create policy member_read on public.couples for select to authenticated using((select auth.uid()) in(owner_id,partner_id));
alter table public.couple_goals enable row level security;
grant select,insert,update,delete on public.couple_goals to authenticated;
create policy goals_read on public.couple_goals for select to authenticated using(private.is_member(couple_id));
create policy goals_add on public.couple_goals for insert to authenticated with check(author_id=(select auth.uid()) and private.is_member(couple_id));
create policy goals_edit on public.couple_goals for update to authenticated using(private.is_member(couple_id)) with check(private.is_member(couple_id));
create policy goals_delete on public.couple_goals for delete to authenticated using(author_id=(select auth.uid()) and private.is_member(couple_id));
alter table public.achievements enable row level security;
grant select,insert,delete on public.achievements to authenticated;
create policy achievements_read on public.achievements for select to authenticated using(private.is_member(couple_id));
create policy achievements_insert on public.achievements for insert to authenticated with check(user_id=(select auth.uid()) and private.is_member(couple_id));
create policy achievements_delete on public.achievements for delete to authenticated using(user_id=(select auth.uid()));
create index sessions_history on public.workout_sessions(user_id,started_at desc);
create index measurements_history on public.measurements(user_id,day desc);
create index couples_owner on public.couples(owner_id);
create index couples_partner on public.couples(partner_id);
create index goals_couple on public.couple_goals(couple_id);
create index achievements_couple on public.achievements(couple_id,created_at desc);

create function private.create_invite() returns text language plpgsql security definer set search_path='' as $$
declare token text;begin
 if auth.uid() is null then raise exception 'Acesso negado';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if exists(select 1 from public.couples where auth.uid() in(owner_id,partner_id)) then raise exception 'Você já possui um vínculo.';end if;
 delete from private.couple_invites where owner_id=auth.uid();
 token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into private.couple_invites(owner_id,token_hash) values(auth.uid(),encode(extensions.digest(token,'sha256'),'hex'));
 return token;
end $$;
create function private.accept_invite(token text) returns uuid language plpgsql security definer set search_path='' as $$
declare inv private.couple_invites; cid uuid;begin
 if auth.uid() is null or length(token)<>64 then raise exception 'Convite inválido';end if;
 select * into inv from private.couple_invites where token_hash=encode(extensions.digest(token,'sha256'),'hex');
 if not found or inv.used_at is not null or inv.expires_at<now() or inv.owner_id=auth.uid() then raise exception 'Convite inválido ou expirado';end if;
 perform pg_advisory_xact_lock(hashtextextended(least(auth.uid()::text,inv.owner_id::text),0));
 perform pg_advisory_xact_lock(hashtextextended(greatest(auth.uid()::text,inv.owner_id::text),0));
 select * into inv from private.couple_invites where id=inv.id for update;
 if inv.used_at is not null or inv.expires_at<now() then raise exception 'Convite inválido ou expirado';end if;
 if exists(select 1 from public.couples where owner_id in(auth.uid(),inv.owner_id) or partner_id in(auth.uid(),inv.owner_id)) then raise exception 'Uma das contas já possui vínculo';end if;
 insert into public.couples(owner_id,partner_id) values(inv.owner_id,auth.uid()) returning id into cid;
 update private.couple_invites set used_at=now() where id=inv.id;
 return cid;
end $$;
create function private.unlink_couple() returns void language plpgsql security definer set search_path='' as $$
begin if auth.uid() is null then raise exception 'Acesso negado';end if;
 delete from private.couple_invites where owner_id=auth.uid();
 delete from public.couples where auth.uid() in(owner_id,partner_id);
end $$;
create function private.partner_summary() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare partner uuid; p public.profiles; result jsonb;begin
 if auth.uid() is null then raise exception 'Acesso negado';end if;
 select case when owner_id=auth.uid() then partner_id else owner_id end into partner from public.couples where auth.uid() in(owner_id,partner_id);
 if partner is null then return null;end if;
 select * into p from public.profiles where user_id=partner;
 result:=jsonb_build_object('name',p.name,'user_id',partner);
 if p.share_workouts then result:=result||jsonb_build_object('workouts',(select count(*) from public.workout_sessions where user_id=partner and status='completed' and started_at>=date_trunc('week',now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'),'calendar',(select coalesce(jsonb_agg(jsonb_build_object('name',name,'days',days,'time',scheduled_time)),'[]') from public.workout_templates where user_id=partner and not archived)); end if;
 if p.share_habits then result:=result||jsonb_build_object('habits',(select count(*) from public.routine_logs l join public.routine_items i on i.id=l.item_id where l.user_id=partner and i.kind='habit' and done and day=(now() at time zone 'America/Sao_Paulo')::date));end if;
 if p.share_body then result:=result||jsonb_build_object('measurements',(select to_jsonb(m)-'user_id'-'notes'-'id' from public.measurements m where user_id=partner order by day desc limit 1));end if;
 return result;
end $$;
-- Public wrappers are invokers; privileged implementations remain outside the API schema.
create function public.create_couple_invite() returns text language sql security invoker set search_path='' as $$select private.create_invite()$$;
create function public.accept_couple_invite(token text) returns uuid language sql security invoker set search_path='' as $$select private.accept_invite(token)$$;
create function public.unlink_couple() returns void language sql security invoker set search_path='' as $$select private.unlink_couple()$$;
create function public.partner_summary() returns jsonb language sql security invoker set search_path='' as $$select private.partner_summary()$$;
revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated;
revoke all on function public.create_couple_invite(),public.accept_couple_invite(text),public.unlink_couple(),public.partner_summary() from public,anon;
grant execute on function public.create_couple_invite(),public.accept_couple_invite(text),public.unlink_couple(),public.partner_summary() to authenticated;

-- Snapshot an entire session atomically; idempotency is client-provided UUID + one active session index.
create function public.start_workout(sid uuid,tid uuid,disposition text default null) returns uuid language plpgsql security invoker set search_path='' as $$
declare existing uuid;begin
 if auth.uid() is null then raise exception 'Acesso negado';end if;
 select id into existing from public.workout_sessions where user_id=auth.uid() and status='active';
 if existing is not null then return existing;end if;
 insert into public.workout_sessions(id,user_id,template_id,name,energy) select sid,auth.uid(),id,name,disposition from public.workout_templates where id=tid and user_id=auth.uid() and not archived;
 if not found then raise exception 'Ficha não encontrada';end if;
 insert into public.session_exercises(id,user_id,session_id,exercise_id,position,sets,reps_min,reps_max,rest_seconds)
 select gen_random_uuid(),auth.uid(),sid,exercise_id,position,sets,reps_min,reps_max,rest_seconds from public.planned_exercises where template_id=tid and user_id=auth.uid();
 if not found then raise exception 'Adicione exercícios antes de iniciar';end if;
 return sid;
end $$;
revoke all on function public.start_workout(uuid,uuid,text) from public,anon;
grant execute on function public.start_workout(uuid,uuid,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('private-photos','private-photos',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy own_photo_read on storage.objects for select to authenticated using(bucket_id='private-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy own_photo_insert on storage.objects for insert to authenticated with check(bucket_id='private-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy own_photo_update on storage.objects for update to authenticated using(bucket_id='private-photos' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='private-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy own_photo_delete on storage.objects for delete to authenticated using(bucket_id='private-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create function public.save_workout(payload jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare tid uuid; row jsonb;begin
 if auth.uid() is null then raise exception 'Acesso negado';end if;
 tid:=coalesce((payload->>'id')::uuid,gen_random_uuid());
 insert into public.workout_templates(id,user_id,name,days,scheduled_time,archived)
 values(tid,auth.uid(),payload->>'name',array(select jsonb_array_elements_text(payload->'days')::int),(payload->>'scheduled_time')::time,coalesce((payload->>'archived')::boolean,false))
 on conflict(id) do update set name=excluded.name,days=excluded.days,scheduled_time=excluded.scheduled_time,archived=excluded.archived;
 delete from public.planned_exercises where template_id=tid;
 for row in select * from jsonb_array_elements(payload->'exercises') loop
 insert into public.planned_exercises(user_id,template_id,exercise_id,position,sets,reps_min,reps_max,rest_seconds) values(auth.uid(),tid,row->>'exercise_id',(row->>'position')::int,(row->>'sets')::int,(row->>'reps_min')::int,(row->>'reps_max')::int,(row->>'rest_seconds')::int);
 end loop;return tid;
end $$;
create function public.seed_workouts(payload jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare row jsonb;begin
 if auth.uid() is null then raise exception 'Acesso negado';end if;
 if exists(select 1 from public.workout_templates where user_id=auth.uid()) then raise exception 'Você já tem fichas. Use criar ou duplicar.';end if;
 for row in select * from jsonb_array_elements(payload) loop perform public.save_workout(row);end loop;
end $$;
revoke all on function public.save_workout(jsonb),public.seed_workouts(jsonb) from public,anon;
grant execute on function public.save_workout(jsonb),public.seed_workouts(jsonb) to authenticated;
