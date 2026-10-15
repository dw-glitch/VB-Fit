import {supabase} from '../lib/supabase';
import {fail} from './data';
import type {GeneratedWorkout} from '../lib/workoutPlanner';

export interface WorkoutDraft extends GeneratedWorkout {id:string}
export async function saveGeneratedPlan(workouts:WorkoutDraft[],startSessionId:string|null){
 const payload=workouts.map(({id,name,days,scheduled_time,exercises})=>({id,name,days,scheduled_time,exercises}));
 const result=await supabase.rpc('save_workout_plan',{payload,start_session_id:startSessionId});
 fail(result.error);
 return result.data as {template_ids:string[];session_id:string|null};
}
