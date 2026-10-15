import {useRef,useState,type FormEvent} from 'react';
import {ArrowLeft,Play,Sparkles} from 'lucide-react';
import {useApp} from '../../hooks/useApp';
import {DaysInput,Field,Modal,NumberInput} from '../../components/ui';
import {days} from '../../lib/domain';
import {generateWorkoutPlan,goalNames,preferencesFromProfile,readTrainingDescription,type GeneratedPlan,type PlanPreferences} from '../../lib/workoutPlanner';
import {saveGeneratedPlan,type WorkoutDraft} from '../../services/workoutPlans';
import {ExerciseVisual} from './ExerciseVisual';

export function WorkoutGenerator({onClose}:{onClose:()=>void}){
 const {data,run,busy,online}=useApp();
 const hasActiveWorkout=data.sessions.some(workout=>workout.status==='active');
 const [preferences,setPreferences]=useState(()=>preferencesFromProfile(data.profile));
 const [description,setDescription]=useState(''),[appliedDescription,setAppliedDescription]=useState(''),[recognized,setRecognized]=useState('');
 const [draft,setDraft]=useState<(Omit<GeneratedPlan,'workouts'>&{workouts:WorkoutDraft[]})|null>(null),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 const lock=useRef(false),sessionId=useRef(crypto.randomUUID());
 const change=<K extends keyof PlanPreferences>(key:K,value:PlanPreferences[K])=>setPreferences(previous=>({...previous,[key]:value}));
 function readDescription(){
  const result=readTrainingDescription(description,preferences);setPreferences(result.preferences);setAppliedDescription(description);
  setRecognized(result.recognized.length?`Preenchi: ${result.recognized.join(', ')}. Confira os campos abaixo.`:'Não identifiquei mudanças automáticas. Confira ou preencha os campos abaixo.');
  return result.preferences;
 }
 function generate(event:FormEvent){
  event.preventDefault();setError('');
  try{
   const input=description!==appliedDescription?readDescription():preferences;
   const plan=generateWorkoutPlan(input,data.exercises.map(exercise=>exercise.id));
   sessionId.current=crypto.randomUUID();
   setDraft({...plan,workouts:plan.workouts.map(workout=>({...workout,id:crypto.randomUUID()}))});
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível montar o treino.');}
 }
 async function save(start:boolean){
  if(lock.current||busy||!draft)return;
  if(!online){setError('Conecte-se à internet para salvar as fichas.');return;}
  start=start&&!hasActiveWorkout;lock.current=true;setSaving(true);setError('');
  try{
   const ok=await run(async()=>{
    try{await saveGeneratedPlan(draft.workouts,start?sessionId.current:null);}
    catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar o plano.');throw e;}
   },start?'Plano salvo. Seu primeiro exercício está pronto.':'Seu plano foi salvo. As fichas anteriores foram mantidas.');
   if(ok)onClose();
  }finally{lock.current=false;setSaving(false);}
 }
 return <Modal title={draft?'Seu treino está pronto':'Montar meu treino'} onClose={()=>{if(!saving&&!busy)onClose();}}>
  {!draft?<form onSubmit={generate}>
   <p className="muted">Conte sua rotina ou confirme os dados do seu perfil. O app escolhe os exercícios e monta as fichas de musculação em academia.</p>
   <Field label="O que você procura? (opcional)" hint="Ex.: quero ganhar massa, sou iniciante, posso treinar 4 dias por semana, tenho 45 minutos e prefiro 3 séries."><textarea maxLength={1500} rows={4} value={description} onChange={event=>setDescription(event.target.value)}/></Field>
   {description.trim()&&<button type="button" className="secondary full" onClick={()=>{setError('');try{readDescription();}catch(e){setError(e instanceof Error?e.message:'Revise a descrição.');}}}>Preencher com minha descrição</button>}
   {recognized&&<p className="soft-note" role="status">{recognized}</p>}
   <h3>Confirme suas informações</h3>
   <Field label="Seu objetivo"><select value={preferences.goal} onChange={event=>change('goal',event.target.value as PlanPreferences['goal'])}>{Object.entries(goalNames).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></Field>
   <Field label="Experiência de treino"><select value={preferences.experience} onChange={event=>change('experience',event.target.value as PlanPreferences['experience'])}><option value="beginner">Iniciante ou voltando a treinar</option><option value="intermediate">Intermediário</option><option value="advanced">Avançado</option></select></Field>
   <Field label="Quais dias você pode treinar?" hint="Escolha até 6 dias. Para até 3 treinos semanais, escolha dias intercalados."><DaysInput value={preferences.days} onChange={value=>change('days',value)}/></Field>
   <div className="form-grid"><Field label="Minutos por treino"><NumberInput required min={20} max={120} value={preferences.minutes} onChange={event=>change('minutes',Number(event.target.value))}/></Field><Field label="Horário de treino"><input type="time" required value={preferences.time} onChange={event=>change('time',event.target.value)}/></Field></div>
   <Field label="Séries por exercício"><select value={preferences.sets} onChange={event=>change('sets',Number(event.target.value) as PlanPreferences['sets'])}><option value={0}>Escolher para mim</option><option value={2}>2 séries</option><option value={3}>3 séries</option><option value={4}>4 séries</option></select></Field>
   <details className="generator-avoid"><summary>Algum exercício ou aparelho que você quer evitar?</summary><p className="muted">Marque os que não quer incluir. O app tentará usar outras opções do catálogo.</p>{data.exercises.map(exercise=><label className="check-label" key={exercise.id}><input type="checkbox" checked={preferences.excluded.includes(exercise.id)} onChange={event=>change('excluded',event.target.checked?[...preferences.excluded,exercise.id]:preferences.excluded.filter(id=>id!==exercise.id))}/>{exercise.name}</label>)}</details>
   <label className="check-label"><input type="checkbox" checked={preferences.needsAdaptation} onChange={event=>change('needsAdaptation',event.target.checked)}/> Tenho dor, lesão ou restrição que precisa de adaptação presencial.</label>
   {error&&<p className="error-text" role="alert">{error}</p>}
   <button className="primary full" disabled={busy}><Sparkles size={18}/> Montar treino para mim</button>
  </form>:<div className="generated-plan">
   <p className="soft-note">{draft.summary}</p>
   <p className="muted">Estas são suas fichas, já com exercícios, séries, repetições e descansos. Confira a sugestão inicial com seu instrutor.</p>
   {draft.workouts.map((workout,index)=><details className="generated-workout" key={workout.id} open={index===0}><summary><strong>{workout.name}</strong><span>{workout.days.map(day=>days[day]).join(' · ')} · {workout.scheduled_time} · cerca de {workout.estimatedMinutes} min</span></summary>{workout.exercises.map(exercise=><div className="generated-exercise" key={exercise.exercise_id}><h3>{data.exercises.find(item=>item.id===exercise.exercise_id)?.name}</h3><p>{exercise.sets} séries × {exercise.reps_min}–{exercise.reps_max} repetições · {exercise.rest_seconds}s de descanso</p><ExerciseVisual exerciseId={exercise.exercise_id}/></div>)}</details>)}
   {draft.notes.map(note=><p className="muted" key={note}>{note}</p>)}
   {hasActiveWorkout&&<p className="soft-note">Seu treino atual está em andamento. Este plano ficará salvo para começar depois.</p>}{data.templates.length>0&&<p className="soft-note">Suas fichas e seu histórico atuais serão mantidos. Este plano será adicionado à sua conta.</p>}
   {error&&<p className="error-text" role="alert">{error}</p>}
   {!online&&<p className="muted">Conecte-se para salvar. A prévia continua disponível nesta tela.</p>}
   <div className="generator-actions"><button className="primary full" disabled={busy||saving||!online} onClick={()=>void save(true)}><Play size={18}/>{saving?'Salvando…':hasActiveWorkout?'Salvar meu próximo plano':'Salvar e começar meu treino'}</button><button className="secondary full" disabled={busy||saving||!online} onClick={()=>void save(false)}>Salvar para depois</button><button className="text-button" disabled={busy||saving} onClick={()=>{setDraft(null);setError('');}}><ArrowLeft size={16}/> Ajustar minhas informações</button></div>
  </div>}
 </Modal>;
}
