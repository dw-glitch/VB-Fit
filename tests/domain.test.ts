import {describe,it,expect} from 'vitest';
import {blankProfile,energyAdvice,localDay,progression,restrictionAlert,starterWorkouts,weekStart} from '../src/lib/domain';
import type {PerformedSet} from '../src/types';
const set=(reps:number):PerformedSet=>({id:'id',user_id:'u',session_exercise_id:'e',set_number:1,weight_kg:20,reps,completed_at:'2026-10-15T12:00:00Z'});
describe('Privacidade e regras da rotina',()=>{
 it('inicia cada pessoa com dados independentes e compartilhamento desativado',()=>{const a=blankProfile('a'),b=blankProfile('b');a.restrictions.push('Intolerância à lactose');expect(b.restrictions).toEqual([]);expect(b.height_cm).toBeNull();expect(a.share_workouts||a.share_body||a.share_habits).toBe(false);});
 it('não sugere progressão por uma única sessão',()=>expect(progression([[set(10),set(10)]],10,2)).toBeNull());
 it('requer todas as séries e duas sessões para sugerir progressão',()=>{expect(progression([[set(10),set(10)],[set(10),set(10)]],10,2)).toContain('pequeno aumento');expect(progression([[set(10)],[set(10),set(10)]],10,2)).toBeNull();expect(progression([[set(8),set(10)],[set(10),set(10)]],10,2)).toBeNull();});
 it('diferencia intolerância à lactose de alergia à proteína do leite',()=>{expect(restrictionAlert('Iogurte sem lactose',['Intolerância à lactose'])).toContain('Declarado sem lactose');expect(restrictionAlert('Iogurte sem lactose',['Alergia à proteína do leite'])).toContain('potencialmente incompatível');expect(restrictionAlert('Leite',['Intolerância à lactose'])).toContain('incompatível');expect(restrictionAlert('Fruta e castanhas',['Intolerância à lactose'])).toBeNull();});
 it('sugere descanso sem bloquear o usuário com disposição baixa',()=>expect(energyAdvice('Baixa')).toContain('Avalie descanso'));
 it('usa a segunda-feira como início da semana, inclusive no domingo',()=>{const sunday=new Date(2026,9,18,10);expect(localDay(weekStart(sunday))).toBe('2026-10-12');});
 it('oferece quatro fichas diferentes nos dias solicitados',()=>{expect(starterWorkouts.map(x=>x.day)).toEqual([1,3,5,6]);expect(starterWorkouts.every(x=>x.exercises.length===5)).toBe(true);});
});
