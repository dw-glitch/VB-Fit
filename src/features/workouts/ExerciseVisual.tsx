import {useState} from 'react';
import {ZoomIn,ZoomOut} from 'lucide-react';
import {exerciseMediaById} from '../../lib/exerciseMedia';

export function ExerciseVisual({exerciseId}:{exerciseId?:string}){
 const exercise=exerciseMediaById.get(exerciseId||'');
 const [expanded,setExpanded]=useState(false),[failed,setFailed]=useState(false);
 if(!exercise)return null;
 return <figure className={`exercise-visual ${expanded?'is-expanded':''}`}>
  <button type="button" className="exercise-visual-toggle" aria-expanded={expanded} aria-label={`${expanded?'Reduzir':'Ampliar'} imagem de ${exercise.name}`} onClick={()=>setExpanded(value=>!value)}>
   {failed?<span className="exercise-image-error">Não foi possível carregar a imagem.</span>:<img src={exercise.image} alt={`${exercise.name} — ${exercise.variant}`} width={512} height={512} loading="lazy" decoding="async" onError={()=>setFailed(true)}/>}
   <span className="exercise-visual-caption"><strong>{exercise.variant}</strong><span>{expanded?<ZoomOut size={16}/>:<ZoomIn size={16}/>} {expanded?'Reduzir imagem':'Ampliar imagem'}</span></span>
  </button>
  {expanded&&<figcaption className="exercise-media-credit">Imagem ilustrativa por <a href={exercise.sourceUrl} target="_blank" rel="noopener noreferrer">Bryl Lim / Workout Guide</a>{exercise.attribution.source&&<>, com obra de <a href={exercise.attribution.source.url} target="_blank" rel="noopener noreferrer">Everkinetic</a></>}. <a href={exercise.attribution.licenseUrl} target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>. O modelo da máquina na sua academia pode variar.</figcaption>}
 </figure>;
}
