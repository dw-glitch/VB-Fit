import {afterEach,describe,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {renderToStaticMarkup} from 'react-dom/server';
import type {Session} from '@supabase/supabase-js';
import {exerciseGuide} from '../src/lib/exerciseMedia';
import {ExerciseVisual} from '../src/features/workouts/ExerciseVisual';
import {ExerciseGuide} from '../src/features/workouts/ExerciseGuide';
import {Workouts} from '../src/features/workouts/Workouts';
import {AppContext} from '../src/hooks/useApp';
import {emptyData} from '../src/services/data';
import {blankProfile} from '../src/lib/domain';

afterEach(()=>vi.unstubAllGlobals());
describe('Referências visuais dos exercícios',()=>{
 it('cobre cada exercício do catálogo persistido com uma imagem íntegra e crédito original',()=>{
  const sql=readFileSync(new URL('../supabase/migrations/20261015153154_vbfit_initial_schema.sql',import.meta.url),'utf8');
  const catalogue=sql.split('insert into public.exercises(id,name,muscle,cues) values')[1].split('create table public.workout_templates')[0];
  const ids=[...catalogue.matchAll(/\('([^']+)'/g)].map(match=>match[1]);
  expect(exerciseGuide.map(exercise=>exercise.id).sort()).toEqual(ids.sort());
  for(const exercise of exerciseGuide){
   const bytes=readFileSync(new URL(`../src/assets/exercises/${exercise.id}.png`,import.meta.url));
   expect(createHash('sha256').update(bytes).digest('hex')).toBe(exercise.sha256);
   expect(bytes.subarray(1,4).toString()).toBe('PNG');
   expect(exercise.image).toBeTruthy();expect(exercise.attribution.license).toBe('CC BY-SA 4.0');
  }
 });
 it('apresenta imagens identificadas no guia, sem exigir dados pessoais',()=>{
  const html=renderToStaticMarkup(<ExerciseGuide/>);
  expect(html.match(/<img /g)).toHaveLength(19);
  for(const exercise of exerciseGuide){expect(html).toContain(exercise.name);expect(html).toContain(`Ampliar imagem de ${exercise.name}`);}
  expect(html).not.toContain('type="email"');
 });
 it('não associa outra imagem a um exercício desconhecido',()=>{
  expect(renderToStaticMarkup(<ExerciseVisual exerciseId="exercise-not-in-catalogue"/>)).toBe('');
 });
 it('exibe a imagem tanto na ficha salva quanto no treino em andamento',()=>{
  vi.stubGlobal('localStorage',{getItem:()=>null});
  const data={...emptyData,profile:blankProfile('qa'),exercises:exerciseGuide.map(({id,name,muscle,cues})=>({id,name,muscle,cues,media_url:null,media_license:null})),templates:[{id:'template',user_id:'qa',name:'Minha ficha',days:[1],scheduled_time:'18:30',archived:false}],plans:[{id:'plan',user_id:'qa',template_id:'template',exercise_id:'smith',position:0,sets:4,reps_min:8,reps_max:10,rest_seconds:90}]};
  const context={data,session:{user:{id:'qa'}} as Session,refresh:async()=>{},run:async()=>true,notice:()=>{},busy:false,online:true,pendingCount:0,refreshQueue:async()=>{}};
  const saved=renderToStaticMarkup(<AppContext.Provider value={context}><Workouts/></AppContext.Provider>);
  expect(saved).toContain('Ampliar imagem de Agachamento no Smith');
  const activeData={...data,sessions:[{id:'session',user_id:'qa',template_id:'template',name:'Minha ficha',started_at:new Date().toISOString(),finished_at:null,status:'active' as const,energy:null,notes:''}],sessionExercises:[{id:'exercise',user_id:'qa',session_id:'session',exercise_id:'smith',position:0,sets:4,reps_min:8,reps_max:10,rest_seconds:90}]};
  const active=renderToStaticMarkup(<AppContext.Provider value={{...context,data:activeData}}><Workouts/></AppContext.Provider>);
  expect(active).toContain('Ampliar imagem de Agachamento no Smith');expect(active).not.toContain('Mídia demonstrativa só será exibida');
 });
});
