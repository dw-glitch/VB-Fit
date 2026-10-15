import {useState} from 'react';
import {ArrowLeft,Search} from 'lucide-react';
import {exerciseGuide} from '../../lib/exerciseMedia';
import {ExerciseVisual} from './ExerciseVisual';

export function ExerciseGuide(){
 const [query,setQuery]=useState('');
 const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
 const matches=exerciseGuide.filter(exercise=>normalize(`${exercise.name} ${exercise.muscle} ${exercise.variant}`).includes(normalize(query.trim())));
 return <main className="exercise-guide">
  <a className="text-button" href="/"><ArrowLeft size={18}/> Voltar ao aplicativo</a>
  <header><span className="eyebrow">V&B FIT · GUIA VISUAL</span><h1>Qual é o exercício?</h1><p className="muted">Veja o equipamento e toque na imagem para ampliar.</p></header>
  <label className="field guide-search"><span><Search size={16}/> Buscar exercício ou grupo muscular</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Ex.: supino, pernas, halteres"/></label>
  <p className="muted" role="status">{matches.length} {matches.length===1?'exercício':'exercícios'}</p>
  {matches.map(exercise=><section className="card guide-exercise" key={exercise.id}><span className="eyebrow">{exercise.muscle}</span><h2>{exercise.name}</h2><ExerciseVisual exerciseId={exercise.id}/><p className="muted">{exercise.cues}</p></section>)}
  {!matches.length&&<p>Nenhum exercício encontrado. Tente outro nome ou grupo muscular.</p>}
  <p className="privacy-note">As imagens ajudam a identificar os exercícios. Confirme os ajustes e a execução com o instrutor da sua academia.</p>
 </main>;
}
