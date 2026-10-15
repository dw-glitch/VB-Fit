import type { AppData, PerformedSet } from '../types';
import { save } from './data';
const DATABASE='vb-fit-private-v1';
async function open(){return new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(DATABASE,1);r.onupgradeneeded=()=>{r.result.createObjectStore('queue',{keyPath:'id'});r.result.createObjectStore('cache');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error('Não foi possível abrir o armazenamento deste dispositivo.'));});}
async function transact<T>(store:string,mode:IDBTransactionMode,action:(s:IDBObjectStore)=>IDBRequest<T>){const db=await open();try{return await new Promise<T>((resolve,reject)=>{const tx=db.transaction(store,mode);const req=action(tx.objectStore(store));let result:T;req.onsuccess=()=>{result=req.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}}
export async function pending(userId:string){const rows=await transact<PerformedSet[]>('queue','readonly',s=>s.getAll());return rows.filter(x=>x.user_id===userId);}
export async function queueSet(row:PerformedSet){await transact('queue','readwrite',s=>s.put(row));}
const syncing=new Map<string,Promise<void>>();
export async function syncQueue(userId:string){
 const active=syncing.get(userId);if(active)return active;
 const task=(async()=>{for(;;){const rows=await pending(userId);if(!rows.length)break;for(const row of rows){await save('performed_sets',row,'session_exercise_id,set_number');await transact('queue','readwrite',s=>s.delete(row.id));}}})();
 syncing.set(userId,task);try{await task;}finally{syncing.delete(userId);}
}
export async function cacheData(userId:string,data:AppData){await transact('cache','readwrite',s=>s.put({...data,partner:null,couple:null,goals:[],achievements:[]},userId));}
export async function readCache(userId:string):Promise<AppData|undefined>{return transact('cache','readonly',s=>s.get(userId));}
export async function clearPrivateDevice(){await transact('queue','readwrite',s=>s.clear());await transact('cache','readwrite',s=>s.clear());}
