import records from '../data/exercise-media.json';

const assets=import.meta.glob<string>('../assets/exercises/*.png',{eager:true,query:'?url',import:'default'});
export const exerciseGuide=records.map(record=>({...record,image:assets[`../assets/exercises/${record.id}.png`]}));
export const exerciseMediaById=new Map(exerciseGuide.map(exercise=>[exercise.id,exercise]));
