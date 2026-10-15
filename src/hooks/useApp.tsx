import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import type {Session} from '@supabase/supabase-js';
import type {AppData} from '../types';
import {emptyData,loadData} from '../services/data';
import {cacheData,pending,readCache,syncQueue} from '../services/offline';
interface Ctx {data:AppData;session:Session;refresh:()=>Promise<void>;run:(fn:()=>Promise<unknown>,success?:string)=>Promise<boolean>;notice:(m:string)=>void;busy:boolean;online:boolean;pendingCount:number;refreshQueue:()=>Promise<void>}
export const AppContext=createContext<Ctx|null>(null);
export function AppProvider({session,children}:{session:Session;children:ReactNode}){
 const [data,setData]=useState(emptyData),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[online,setOnline]=useState(navigator.onLine),[pendingCount,setCount]=useState(0),[error,setError]=useState('');const lock=useRef(false);const uid=session.user.id;
 const notice=useCallback((s:string)=>setMessage(s),[]);
 const refreshQueue=useCallback(async()=>{setCount((await pending(uid)).length);},[uid]);
 const refresh=useCallback(async()=>{if(navigator.onLine)await syncQueue(uid);const next=await loadData();setData(next);setError('');await cacheData(uid,next);await refreshQueue();},[uid,refreshQueue]);
 const run=useCallback(async(fn:()=>Promise<unknown>,success?:string)=>{if(lock.current)return false;lock.current=true;setBusy(true);try{await fn();await refresh();if(success)notice(success);return true;}catch(e){notice(e instanceof Error?e.message:'Não foi possível salvar. Tente novamente.');return false;}finally{lock.current=false;setBusy(false);}},[refresh,notice]);
 useEffect(()=>{let alive=true;setLoading(true);setData(emptyData);(async()=>{try{await refresh();}catch(e){const cache=await readCache(uid);if(alive){if(cache){setData(cache);setError('Você está usando os dados salvos neste dispositivo. As séries pendentes serão sincronizadas ao reconectar.');}else setError(e instanceof Error?e.message:'Não foi possível carregar os dados.');}}finally{if(alive)setLoading(false);}})();return()=>{alive=false;};},[uid,refresh]);
 useEffect(()=>{const on=()=>{setOnline(true);syncQueue(uid).then(refresh).catch(()=>notice('Ainda há séries pendentes de sincronização.'));};const off=()=>setOnline(false);window.addEventListener('online',on);window.addEventListener('offline',off);return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off);};},[uid,refresh,notice]);
 useEffect(()=>{if(!message)return;const t=setTimeout(()=>setMessage(''),6500);return()=>clearTimeout(t);},[message]);
 useEffect(()=>{const p=data.profile?.theme||'system';const media=matchMedia('(prefers-color-scheme: dark)');const apply=()=>document.documentElement.dataset.theme=p==='system'?(media.matches?'dark':'light'):p;apply();media.addEventListener('change',apply);return()=>media.removeEventListener('change',apply);},[data.profile?.theme]);
 return <AppContext.Provider value={{data,session,refresh,run,notice,busy,online,pendingCount,refreshQueue}}>{loading?<div className="boot"><span className="brand-mark">v&b</span><p>Preparando sua rotina…</p></div>:<>{error&&<div className="system-message" role="alert">{error} <button onClick={()=>void run(refresh)}>Tentar novamente</button></div>}{!data.profile&&error?<div className="empty"><h1>Vamos reconectar?</h1><p>Confira sua conexão para carregar seu perfil com segurança.</p></div>:children}</>}{message&&<div role="status" className="toast">{message}<button aria-label="Fechar aviso" onClick={()=>setMessage('')}>×</button></div>}</AppContext.Provider>;
}
export function useApp(){const ctx=useContext(AppContext);if(!ctx)throw new Error('AppProvider ausente');return ctx;}
