import type {Profile} from '../types';

export type Goal='muscle'|'strength'|'fitness';
export interface PlanPreferences {
 goal:Goal;experience:'beginner'|'intermediate'|'advanced';days:number[];minutes:number;
 sets:0|2|3|4;time:string;excluded:string[];needsAdaptation:boolean;
}
export interface GeneratedExercise {exercise_id:string;position:number;sets:number;reps_min:number;reps_max:number;rest_seconds:number}
export interface GeneratedWorkout {name:string;days:number[];scheduled_time:string;exercises:GeneratedExercise[];estimatedMinutes:number}
export interface GeneratedPlan {workouts:GeneratedWorkout[];notes:string[];summary:string}
export const goalNames:Record<Goal,string>={muscle:'Ganhar massa muscular',strength:'Ganhar força',fitness:'Condicionamento e constância'};
const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const numberWords:Record<string,number>={um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6};
export function suggestedDays(count:number){return ({1:[2],2:[1,4],3:[1,3,5],4:[1,3,5,6],5:[1,2,3,5,6],6:[1,2,3,4,5,6]} as Record<number,number[]>)[count]||[1,3,5];}
function inferGoal(text:string):Goal|undefined {
 if(/hipertrof|massa muscular|ganhar massa|aumentar massa/.test(text))return 'muscle';
 if(/forca/.test(text))return 'strength';
 if(/emagrec|perder (?:peso|gordura)|condicion|constancia|saude/.test(text))return 'fitness';
}
export function preferencesFromProfile(profile?:Profile|null):PlanPreferences {
 return {goal:inferGoal(normalize(profile?.goal||''))||'muscle',experience:profile?.experience==='Avançado'?'advanced':profile?.experience==='Intermediário'?'intermediate':'beginner',days:suggestedDays(Math.max(1,Math.min(6,profile?.weekly_target||3))),minutes:Math.max(20,Math.min(120,profile?.duration_minutes||45)),sets:0,time:profile?.workout_time?.slice(0,5)||'18:30',excluded:[],needsAdaptation:false};
}

/** Conservative extraction only: explicit values are shown for review before generating. */
export function readTrainingDescription(text:string,current:PlanPreferences){
 const value=normalize(text),next={...current,days:[...current.days],excluded:[...current.excluded]},recognized:string[]=[];
 if(/\b(?:em casa|na minha casa|sem academia)\b/.test(value))throw new Error('Este gerador usa o catálogo de musculação em academia. O catálogo atual ainda não cobre um plano completo para treinar em casa.');
 const goal=inferGoal(value);if(goal){next.goal=goal;recognized.push('objetivo');}
 if(/iniciante|comecando|nunca treinei|voltando a treinar/.test(value)){next.experience='beginner';recognized.push('experiência');}
 else if(/intermediario/.test(value)){next.experience='intermediate';recognized.push('experiência');}
 else if(/avancado/.test(value)){next.experience='advanced';recognized.push('experiência');}
 const duration=value.match(/\b(\d{2,3})\s*(?:min\b|minutos?\b)/);
 if(duration){next.minutes=Number(duration[1]);recognized.push('tempo por treino');}else{const hours=value.match(/\b([12])\s*h(?:oras?)?\s*(?:por treino|para treinar|de treino)/);if(hours){next.minutes=Number(hours[1])*60;recognized.push('tempo por treino');}}
 if(/\b(?:7|sete)\s*(?:dias?|vezes)\s*(?:por|na|a)\s*semana/.test(value))throw new Error('Escolha até 6 dias de musculação para reservar ao menos um dia livre na semana.');
 const frequency=value.match(/(?:trein(?:o|ar)|academia)[^.;\n]{0,40}?\b([1-6]|uma?|dois|duas|tres|quatro|cinco|seis)\s*(?:dias?|vezes|x)\b/)
  ||value.match(/\b([1-6]|uma?|dois|duas|tres|quatro|cinco|seis)\s*(?:dias?|vezes|x)\s*(?:por|na|a)\s*semana\b/);
 if(frequency){next.days=suggestedDays(Number(frequency[1])||numberWords[frequency[1]]);recognized.push('dias por semana');}
 const daySection=value.match(/(?:treinar|treinos?|dias de treino|dias disponiveis)\s*:?([^.;\n]+)/)?.[1];
 if(daySection){
  const names=[/\bdomingo\b|\bdom\b/,/\bsegunda(?:-feira)?\b|\bseg\b/,/\bterca(?:-feira)?\b|\bter\b/,/\bquarta(?:-feira)?\b|\bqua\b/,/\bquinta(?:-feira)?\b|\bqui\b/,/\bsexta(?:-feira)?\b|\bsex\b/,/\bsabado\b|\bsab\b/];
  const explicit=names.flatMap((pattern,index)=>pattern.test(daySection)?[index]:[]);
  const range=daySection.match(/(segunda|terca|quarta|quinta|sexta|sabado|domingo)(?:-feira)?\s*(?:a|ate)\s*(segunda|terca|quarta|quinta|sexta|sabado|domingo)(?:-feira)?/);
  if(range){const number:Record<string,number>={domingo:0,segunda:1,terca:2,quarta:3,quinta:4,sexta:5,sabado:6};let cursor=number[range[1]];for(let count=0;count<7;count++){if(!explicit.includes(cursor))explicit.push(cursor);if(cursor===number[range[2]])break;cursor=(cursor+1)%7;}}
  if(explicit.length){next.days=explicit;recognized.push('dias específicos');}
 }
 const clock=value.match(/\b(?:treino|treinar)\s+(?:as?|pelas)\s*(\d{1,2})(?:[:h;]([0-5]\d)|h)?\b/);
 if(clock){next.time=`${clock[1].padStart(2,'0')}:${clock[2]||'00'}`;recognized.push('horário');}
 const sets=value.match(/\b([234]|duas|tres|quatro)\s*series\b/);
 if(sets){next.sets=(Number(sets[1])||numberWords[sets[1]]) as 2|3|4;recognized.push('séries');}
 const avoidSegments=[...value.matchAll(/(?:\bsem\b|\bevitar\b|nao (?:quero|gosto de|posso fazer|tenho|tem))([^.;\n]+)/g)].map(match=>match[1]);
 const avoidAliases:Record<string,RegExp>={supino:/supino(?! inclinado)/,inclinado:/supino inclinado/,puxada:/puxada frontal/,neutra:/pegada neutra|puxada neutra/,remada:/remada baixa/,articulada:/remada articulada/,ombros:/desenvolvimento/,lateral:/elevacao lateral/,triceps:/triceps/,rosca:/rosca/,legpress:/leg press/,smith:/smith|agachamento|agachar/,mesa:/mesa flexora/,pelvica:/elevacao pelvica/,panturrilha:/panturrilha(?! sentado)/,stiff:/stiff/,extensora:/extensora/,flexora:/cadeira flexora/,sentado:/panturrilha sentado/};
 for(const [id,pattern] of Object.entries(avoidAliases)){if(avoidSegments.some(segment=>pattern.test(segment))&&!next.excluded.includes(id)){next.excluded.push(id);recognized.push('exercícios a evitar');}}
 const equipmentAvoid:Record<string,string[]>={halter:['ombros','inclinado','lateral','rosca','stiff'],polia:['puxada','neutra','remada','triceps'],barra:['supino','pelvica'],maquina:['legpress','mesa','flexora','extensora','panturrilha','sentado','articulada','smith']};
 for(const [equipment,ids] of Object.entries(equipmentAvoid)){if(avoidSegments.some(segment=>segment.includes(equipment))){next.excluded=[...new Set([...next.excluded,...ids])];recognized.push('equipamentos indisponíveis');}}
 const clinical=value.split(/[.;\n]|\bmas\b|\bporem\b/).some(clause=>/dor (?:no|na|ao)|lesao|hernia|cirurgia|gestante|gravida/.test(clause)&&!/(?:sem|nao tenho|nao sinto|nao estou)\s+(?:nenhuma?\s+)?(?:dor|lesao|hernia|gestante|gravida)/.test(clause));
 if(clinical){next.needsAdaptation=true;recognized.push('necessidade de adaptação presencial');}
 return {preferences:next,recognized:[...new Set(recognized)]};
}

const choices={
 push:['supino','inclinado'],pull:['puxada','remada','articulada','neutra'],shoulder:['ombros','lateral'],
 knee:['legpress','smith','extensora'],hip:['pelvica','stiff'],hamstring:['mesa','flexora'],calf:['panturrilha','sentado'],
 biceps:['rosca'],triceps:['triceps']
};
type Group=keyof typeof choices;
export function estimateWorkoutMinutes(exercises:GeneratedExercise[]){
 return Math.ceil(7+exercises.reduce((seconds,e)=>seconds+e.sets*45+(e.sets-1)*e.rest_seconds+60,0)/60);
}
export function generateWorkoutPlan(input:PlanPreferences,availableIds:string[]):GeneratedPlan {
 if(input.needsAdaptation)throw new Error('Dor, lesão ou restrição exige uma adaptação que este gerador não avalia. Peça uma orientação ao seu instrutor ou profissional de saúde antes de montar a ficha.');
 if(!Object.keys(goalNames).includes(input.goal)||!['beginner','intermediate','advanced'].includes(input.experience))throw new Error('Confirme o objetivo e a experiência.');
 const days=[...new Set(input.days)].sort((a,b)=>(a||7)-(b||7));
 if(!days.length||days.length>6||days.some(day=>!Number.isInteger(day)||day<0||day>6))throw new Error('Escolha de 1 a 6 dias para treinar.');
 if(!Number.isFinite(input.minutes)||input.minutes<20||input.minutes>120)throw new Error('Informe entre 20 e 120 minutos por treino.');
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time))throw new Error('Informe um horário de treino válido.');
 if(![0,2,3,4].includes(input.sets))throw new Error('Escolha séries automáticas, 2, 3 ou 4.');
 const available=new Set(availableIds.filter(id=>!input.excluded.includes(id)));
 const notes:string[]=[];
 if(days.length===1)notes.push('Um dia é um começo. Se sua rotina permitir, mais um dia ajuda a trabalhar os grupos musculares com maior frequência.');
 if(input.goal==='fitness')notes.push('Esta sugestão organiza a musculação; não promete perda de gordura localizada.');
 // Start after the longest weekly gap so an odd split does not repeat a muscle group on adjacent days.
 if(days.length>=4&&days.length%2){let gapIndex=0;for(let i=1;i<days.length;i++){if((days[(i+1)%days.length]-days[i]+7)%7>(days[(gapIndex+1)%days.length]-days[gapIndex]+7)%7)gapIndex=i;}days.push(...days.splice(0,(gapIndex+1)%days.length));}
 const fullBody=days.length<=3;
 if(fullBody&&days.length>1&&days.some(day=>days.includes((day+1)%7)))throw new Error('Para o plano de corpo inteiro, escolha dias intercalados. Se só pode treinar em dias seguidos, peça uma divisão adaptada ao instrutor.');
 let sets=input.sets|| (input.experience==='beginner'?2:3);
 const repRange=input.goal==='fitness'?[10,15]:input.goal==='strength'&&input.experience!=='beginner'?[6,10]:[8,12];
 const compoundRest=input.goal==='strength'?120:90;
 function build(day:number,index:number):GeneratedWorkout {
  const upper=index%2===0;
  const groups:Group[]=fullBody?['knee','push','pull','hip','shoulder','calf']:
   upper?['push','pull','shoulder','pull','triceps','biceps']:['knee','hip','hamstring','calf','knee'];
  const required=fullBody?3:upper?2:3;
  const selected:string[]=[];
  for(let i=0;i<groups.length;i++){
   const group=groups[i],options=choices[group];const rotated=[...options.slice(index%options.length),...options.slice(0,index%options.length)];
   const exercise=rotated.find(id=>available.has(id)&&!selected.includes(id));
   if(!exercise){if(i<required)throw new Error('Não há exercícios suficientes no catálogo para esta combinação. Revise os exercícios que pediu para evitar.');continue;}
   selected.push(exercise);
  }
  const rows=selected.map((exercise_id,position)=>({exercise_id,position,sets,reps_min:['panturrilha','sentado'].includes(exercise_id)?12:repRange[0],reps_max:['panturrilha','sentado'].includes(exercise_id)?15:repRange[1],rest_seconds:['rosca','triceps','lateral','extensora','mesa','flexora','panturrilha','sentado'].includes(exercise_id)?60:compoundRest}));
  while(rows.length>required&&estimateWorkoutMinutes(rows)>input.minutes)rows.pop();
  if(estimateWorkoutMinutes(rows)>input.minutes)throw new Error('Esse tempo não comporta as séries escolhidas e os descansos. Aumente o tempo ou reduza o número de séries.');
  return {name:`Meu treino ${String.fromCharCode(65+index)} · ${fullBody?'Corpo inteiro':upper?'Superiores':'Inferiores'}`,days:[day],scheduled_time:input.time,exercises:rows,estimatedMinutes:estimateWorkoutMinutes(rows)};
 }
 const workouts=days.map(build);
 if(input.experience==='beginner'&&input.sets===4)notes.push('Você escolheu quatro séries. Confira esse volume e a carga com o instrutor, especialmente no começo.');
 notes.push('O tempo é estimado, incluindo 7 minutos para preparação. A carga é ajustada durante a execução, sem testar seu máximo.');
 return {workouts,notes,summary:`${days.length} ${days.length===1?'dia':'dias'} por semana · ${goalNames[input.goal]} · ${sets} séries por exercício`};
}
