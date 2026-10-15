import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import type {Session} from '@supabase/supabase-js';
import {AppContext} from '../src/hooks/useApp';
import {emptyData} from '../src/services/data';
import {blankProfile} from '../src/lib/domain';
import {Dashboard} from '../src/features/dashboard/Dashboard';
import {Workouts} from '../src/features/workouts/Workouts';
import {Nutrition} from '../src/features/nutrition/Nutrition';
import {Progress} from '../src/features/progress/Progress';
import {Couple} from '../src/features/couple/Couple';
import {Habits} from '../src/features/habits/Habits';
import {Settings} from '../src/features/settings/Settings';
const context={data:{...emptyData,profile:blankProfile('qa','Pessoa de teste')},session:{user:{id:'qa',email:'qa@example.invalid',user_metadata:{}}} as Session,refresh:async()=>{},run:async()=>true,notice:()=>{},busy:false,online:true,pendingCount:0,refreshQueue:async()=>{}};
describe('Estados iniciais reais, sem dados demonstrativos',()=>{
 for(const [name,Component] of [['Treinos',Workouts],['Alimentação',Nutrition],['Evolução',Progress],['Nós',Couple],['Hábitos',Habits],['Perfil',Settings]] as const){it(`renderiza ${name} com uma conta vazia`,()=>{const html=renderToStaticMarkup(<AppContext.Provider value={context}><Component/></AppContext.Provider>);expect(html).not.toContain('NaN');expect(html).not.toContain('undefined');expect(html.length).toBeGreaterThan(400);});}
 it('mostra zero treinos e nenhum peso inventado no painel inicial',()=>{const html=renderToStaticMarkup(<AppContext.Provider value={context}><Dashboard navigate={()=>{}}/></AppContext.Provider>);expect(html).toContain('Pessoa');expect(html).toContain('0');expect(html).toContain('Hoje não há treino programado');expect(html).not.toContain('75 kg');});
});
