// @vitest-environment jsdom
import {afterEach,describe,it,expect,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import type {Session} from '@supabase/supabase-js';
import {AppContext} from '../src/hooks/useApp';
import {emptyData} from '../src/services/data';
import {blankProfile} from '../src/lib/domain';
import {exerciseGuide} from '../src/lib/exerciseMedia';
import {WorkoutGenerator} from '../src/features/workouts/WorkoutGenerator';
import {saveGeneratedPlan} from '../src/services/workoutPlans';
vi.mock('../src/services/workoutPlans',()=>({saveGeneratedPlan:vi.fn(async()=>({template_ids:[],session_id:null}))}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
function mount(active=false){
 const close=vi.fn();const data={...emptyData,sessions:active?[{id:'active-session',user_id:'qa',template_id:null,name:'Treino atual',started_at:new Date().toISOString(),finished_at:null,status:'active' as const,energy:null,notes:''}]:[],profile:blankProfile('qa'),exercises:exerciseGuide.map(({id,name,muscle,cues})=>({id,name,muscle,cues,media_url:null,media_license:null}))};
 const context={data,session:{user:{id:'qa'}} as Session,refresh:async()=>{},run:async(fn:()=>Promise<unknown>)=>{try{await fn();return true;}catch{return false;}},notice:()=>{},busy:false,online:true,pendingCount:0,refreshQueue:async()=>{}};
 render(<AppContext.Provider value={context}><WorkoutGenerator onClose={close}/></AppContext.Provider>);return close;
}
describe('Informações pessoais → fichas prontas → primeiro exercício',()=>{
 it('monta fichas a partir da descrição sem exigir escolha manual de exercícios e só salva após revisão',async()=>{
  const close=mount();let dialog=screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByRole('textbox',{name:/O que você procura/}),{target:{value:'Quero hipertrofia, sou iniciante, treino 4 dias por semana e tenho 45 minutos.'}});
  fireEvent.click(within(dialog).getByRole('button',{name:'Montar treino para mim'}));
  dialog=screen.getByRole('dialog',{name:'Seu treino está pronto'});
  expect(within(dialog).getAllByText(/Meu treino [A-D] ·/)).toHaveLength(4);
  expect(within(dialog).getAllByRole('img').length).toBeGreaterThan(0);
  expect(saveGeneratedPlan).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole('button',{name:'Salvar e começar meu treino'}));
  await waitFor(()=>expect(close).toHaveBeenCalledTimes(1));
  expect(vi.mocked(saveGeneratedPlan).mock.calls[0][0]).toHaveLength(4);
  expect(vi.mocked(saveGeneratedPlan).mock.calls[0][1]).toEqual(expect.any(String));
 });
 it('salva o plano seguinte sem iniciar outro treino quando já existe sessão ativa',async()=>{
  mount(true);fireEvent.click(screen.getByRole('button',{name:'Montar treino para mim'}));
  fireEvent.click(screen.getByRole('button',{name:'Salvar meu próximo plano'}));
  await waitFor(()=>expect(saveGeneratedPlan).toHaveBeenCalledTimes(1));
  expect(vi.mocked(saveGeneratedPlan).mock.calls[0][1]).toBeNull();
 });
 it('mantém os identificadores do plano e da sessão quando o usuário tenta salvar novamente após erro',async()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:'Montar treino para mim'}));
  vi.mocked(saveGeneratedPlan).mockRejectedValueOnce(new Error('Conexão interrompida'));
  fireEvent.click(screen.getByRole('button',{name:'Salvar e começar meu treino'}));
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button',{name:'Salvar e começar meu treino'}));
  await waitFor(()=>expect(saveGeneratedPlan).toHaveBeenCalledTimes(2));
  const calls=vi.mocked(saveGeneratedPlan).mock.calls;expect(calls[1]).toEqual(calls[0]);
 });
});
