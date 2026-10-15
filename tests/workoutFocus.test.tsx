// @vitest-environment jsdom
import {afterEach,describe,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import type {Session} from '@supabase/supabase-js';
import {AppContext} from '../src/hooks/useApp';
import {emptyData} from '../src/services/data';
import {blankProfile} from '../src/lib/domain';
import {exerciseGuide} from '../src/lib/exerciseMedia';
import {Workouts} from '../src/features/workouts/Workouts';
import {queueSet} from '../src/services/offline';

vi.mock('../src/services/offline',()=>({pending:vi.fn(async()=>[]),queueSet:vi.fn(),syncQueue:vi.fn(async()=>{})}));
afterEach(()=>{cleanup();vi.clearAllMocks();localStorage.clear();});

async function openWorkout(){
 const data={...emptyData,profile:blankProfile('qa'),exercises:exerciseGuide.map(({id,name,muscle,cues})=>({id,name,muscle,cues,media_url:null,media_license:null})),sessions:[{id:'session',user_id:'qa',template_id:null,name:'Superiores A',started_at:new Date().toISOString(),finished_at:null,status:'active' as const,energy:null,notes:''}],sessionExercises:['supino','puxada'].map((exercise_id,position)=>({id:exercise_id,user_id:'qa',session_id:'session',exercise_id,position,sets:4,reps_min:8,reps_max:10,rest_seconds:90}))};
 const context={data,session:{user:{id:'qa'}} as Session,refresh:async()=>{},run:async()=>true,notice:()=>{},busy:false,online:true,pendingCount:0,refreshQueue:async()=>{}};
 await act(async()=>{render(<AppContext.Provider value={context}><Workouts/></AppContext.Provider>);});
}

describe('Um exercício por tela ao iniciar o treino',()=>{
 it('abre o primeiro exercício com nome, imagem e séries, sem pesquisa',async()=>{
  await openWorkout();
  const exercise=screen.getByRole('region',{name:'Exercício 1: Supino reto'});
  expect(within(exercise).getByRole('heading',{name:'Supino reto'})).toBeTruthy();
  expect(within(exercise).getByRole('img',{name:'Supino reto — Barra no banco reto'})).toBeTruthy();
  expect(within(exercise).getAllByRole('spinbutton')).toHaveLength(8);
  expect(screen.queryByRole('heading',{name:'Puxada frontal'})).toBeNull();
  expect(screen.queryByRole('searchbox')).toBeNull();
 });
 it('avança e volta preservando os valores digitados sem concluir séries automaticamente',async()=>{
  await openWorkout();
  const first=screen.getByRole('region',{name:'Exercício 1: Supino reto'});
  fireEvent.change(within(first).getByRole('spinbutton',{name:'Carga da série 1'}),{target:{value:'27.5'}});
  fireEvent.click(screen.getByRole('button',{name:'Próximo exercício'}));
  expect(screen.queryByRole('heading',{name:'Supino reto'})).toBeNull();
  const second=screen.getByRole('region',{name:'Exercício 2: Puxada frontal'});
  expect(within(second).getByRole('img',{name:'Puxada frontal — Polia alta, pegada aberta'})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Anterior'}));
  const field=within(screen.getByRole('region',{name:'Exercício 1: Supino reto'})).getByRole('spinbutton',{name:'Carga da série 1'}) as HTMLInputElement;
  expect(field.value).toBe('27.5');expect(queueSet).not.toHaveBeenCalled();
 });
});
