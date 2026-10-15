import {describe,it,expect} from 'vitest';
import {blankProfile} from '../src/lib/domain';
import {exerciseGuide} from '../src/lib/exerciseMedia';
import {generateWorkoutPlan,preferencesFromProfile,readTrainingDescription,suggestedDays} from '../src/lib/workoutPlanner';
const available=exerciseGuide.map(exercise=>exercise.id);
const base=preferencesFromProfile(blankProfile('test'));

describe('Montagem automática de treino',()=>{
 it('usa o objetivo, experiência, frequência, tempo e horário da própria pessoa',()=>{
  const input=preferencesFromProfile({...blankProfile('test'),goal:'Quero ganhar força',experience:'Intermediário',weekly_target:3,duration_minutes:45,workout_time:'19:15'});
  expect(input).toMatchObject({goal:'strength',experience:'intermediate',minutes:45,time:'19:15',days:[1,3,5]});
 });
 it.each([1,2,3,4,5,6])('gera %i fichas com dias distintos, imagens existentes e tempo dentro do limite',count=>{
  const result=generateWorkoutPlan({...base,days:suggestedDays(count),minutes:45},available);
  expect(result.workouts).toHaveLength(count);
  expect(new Set(result.workouts.flatMap(workout=>workout.days)).size).toBe(count);
  for(const workout of result.workouts){
   expect(workout.estimatedMinutes).toBeLessThanOrEqual(45);
   expect(new Set(workout.exercises.map(exercise=>exercise.exercise_id)).size).toBe(workout.exercises.length);
   for(const exercise of workout.exercises){expect(available).toContain(exercise.exercise_id);expect(exercise.sets).toBe(2);expect(exercise.reps_min).toBeLessThanOrEqual(exercise.reps_max);}
  }
 });
 it('respeita quatro séries explícitas e usa intervalos maiores na opção de força',()=>{
  const plan=generateWorkoutPlan({...base,goal:'strength',experience:'intermediate',sets:4,minutes:60},available);
  expect(plan.workouts.every(workout=>workout.exercises.every(exercise=>exercise.sets===4))).toBe(true);
  expect(plan.workouts[0].exercises[0]).toMatchObject({reps_min:6,reps_max:10,rest_seconds:120});
 });
 it('substitui os exercícios excluídos sem incluí-los na sugestão',()=>{
  const excluded=['smith','stiff','puxada'];
  const plan=generateWorkoutPlan({...base,excluded},available);
  expect(plan.workouts.flatMap(workout=>workout.exercises).some(exercise=>excluded.includes(exercise.exercise_id))).toBe(false);
 });
 it('lê informações explícitas em português e preserva o que não foi informado',()=>{
  const result=readTrainingDescription('Quero hipertrofia, sou intermediário, treino quatro dias por semana, tenho 45 minutos e prefiro 4 séries. Quero evitar Smith e stiff.',base);
  expect(result.preferences).toMatchObject({goal:'muscle',experience:'intermediate',days:[1,3,5,6],minutes:45,sets:4,excluded:['smith','stiff'],time:base.time});
 });
 it('reconhece dias específicos e não interpreta o horário de acordar como duração',()=>{
  const result=readTrainingDescription('Acordo às 5h. Posso treinar segunda, quarta e sexta, 1 hora por treino.',base);
  expect(result.preferences.days).toEqual([1,3,5]);expect(result.preferences.minutes).toBe(60);
 });
 it('entende faixas de dias e horários explícitos de treino',()=>{
  const input=readTrainingDescription('Posso treinar segunda a sexta. Treino às 19h30.',base).preferences;
  expect([...input.days].sort()).toEqual([1,2,3,4,5]);expect(input.time).toBe('19:30');
 });
 it('não transforma ausência de dor em relato de dor',()=>{
  expect(readTrainingDescription('Não tenho dor no joelho.',base).preferences.needsAdaptation).toBe(false);
  expect(readTrainingDescription('Tenho dor no joelho.',base).preferences.needsAdaptation).toBe(true);
  expect(readTrainingDescription('Não tenho dor, mas fiz cirurgia.',base).preferences.needsAdaptation).toBe(true);
 });
 it('leva em conta equipamentos explicitamente indisponíveis',()=>{
  const input=readTrainingDescription('Não tenho halteres. Quero evitar Smith.',base).preferences;
  expect(input.excluded).toEqual(expect.arrayContaining(['smith','ombros','inclinado','lateral','rosca','stiff']));
 });
 it('recusa adaptação clínica, catálogo insuficiente e uma duração incompatível com o volume',()=>{
  expect(()=>generateWorkoutPlan({...base,needsAdaptation:true},available)).toThrow('adaptação');
  expect(()=>generateWorkoutPlan(base,['supino'])).toThrow('catálogo');
  expect(()=>generateWorkoutPlan({...base,sets:4,minutes:20,days:[1,3,5]},available)).toThrow('tempo');
 });
 it('não ignora silenciosamente treino em casa, sete dias ou dias consecutivos de corpo inteiro',()=>{
  expect(()=>readTrainingDescription('Quero treinar em casa.',base)).toThrow('em casa');
  expect(()=>readTrainingDescription('Treino 7 dias por semana.',base)).toThrow('6 dias');
  expect(()=>generateWorkoutPlan({...base,days:[1,2]},available)).toThrow('intercalados');
 });
});
