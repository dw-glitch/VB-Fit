import { supabase as db } from '../lib/supabase';
import type { AppData, Profile } from '../types';
import { starterWorkouts } from '../lib/domain';
export const emptyData:AppData={profile:null,exercises:[],templates:[],plans:[],sessions:[],sessionExercises:[],sets:[],meals:[],mealLogs:[],routines:[],routineLogs:[],checkins:[],measurements:[],photos:[],reminders:[],couple:null,goals:[],achievements:[],partner:null};
export function fail(error:{message:string}|null){if(error)throw new Error(error.message);}
export async function loadData():Promise<AppData>{
 const names=['profiles','exercises','workout_templates','planned_exercises','workout_sessions','session_exercises','performed_sets','meal_plans','meal_logs','routine_items','routine_logs','checkins','measurements','progress_photos','reminders','couples','couple_goals','achievements'] as const;
 const results=await Promise.all(names.map(async n=>{let q=db.from(n).select('*');if(n==='workout_sessions')q=q.order('started_at',{ascending:false}).limit(300);else if(n==='performed_sets')q=q.order('completed_at',{ascending:false}).limit(3000);else if(n==='measurements'||n==='checkins')q=q.order('day',{ascending:false}).limit(365);else if(n==='meal_logs'||n==='routine_logs')q=q.order('day',{ascending:false}).limit(1000);else if(n==='achievements')q=q.order('created_at',{ascending:false}).limit(100);const r=await q;fail(r.error);return r.data||[];}));
 const [p,e,t,pl,s,se,st,m,ml,r,rl,c,me,ph,re,co,g,a]=results;
 const partner=await db.rpc('partner_summary');fail(partner.error);
 return {profile:p[0]||null,exercises:e,templates:t,plans:pl,sessions:s,sessionExercises:se,sets:st,meals:m,mealLogs:ml,routines:r,routineLogs:rl,checkins:c,measurements:me,photos:ph,reminders:re,couple:co[0]||null,goals:g,achievements:a,partner:partner.data} as AppData;
}
export async function save(table:string,row:unknown,onConflict?:string){const r=await db.from(table).upsert(row,onConflict?{onConflict}:undefined).select();fail(r.error);return r.data;}
export async function remove(table:string,id:string){const r=await db.from(table).delete().eq('id',id);fail(r.error);}
export async function patch(table:string,id:string,values:unknown){const r=await db.from(table).update(values).eq('id',id);fail(r.error);}
export async function saveProfile(profile:Profile){return save('profiles',profile);}
export async function seedWorkouts(_userId:string,time='18:30'){
 const payload=starterWorkouts.map(t=>({name:t.name,days:[t.day],scheduled_time:time,exercises:t.exercises.map((exercise_id,position)=>({exercise_id,position,sets:4,reps_min:exercise_id==='panturrilha'||exercise_id==='sentado'?12:8,reps_max:exercise_id==='panturrilha'||exercise_id==='sentado'?15:10,rest_seconds:90}))}));
 const r=await db.rpc('seed_workouts',{payload});fail(r.error);
}
export async function exportData(){const tables=['profiles','workout_templates','planned_exercises','workout_sessions','session_exercises','performed_sets','meal_plans','meal_logs','routine_items','routine_logs','checkins','measurements','progress_photos','reminders'];const result:Record<string,unknown>={exported_at:new Date().toISOString(),version:1};for(const t of tables){const rows:unknown[]=[];for(let offset=0;;offset+=500){const r=await db.from(t).select('*').order(t==='profiles'?'user_id':'id').range(offset,offset+499);fail(r.error);rows.push(...(r.data||[]));if((r.data||[]).length<500)break;}result[t]=rows;}return result;}
export async function photoUrl(path:string){const r=await db.storage.from('private-photos').createSignedUrl(path,300);fail(r.error);return r.data!.signedUrl;}
export async function uploadPhoto(userId:string,file:File){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('Use JPG, PNG ou WebP de até 5 MB.');const path=`${userId}/${crypto.randomUUID()}.${file.type.split('/')[1]}`;const r=await db.storage.from('private-photos').upload(path,file,{contentType:file.type});fail(r.error);return path;}
