import { createClient } from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured=!!url&&!!key;
export const supabase=createClient(url||'https://configuration-required.supabase.co',key||'configuration-required',{global:{fetch:async(input,init)=>{const controller=new AbortController();const abort=()=>controller.abort();if(init?.signal?.aborted)controller.abort();init?.signal?.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,12000);try{return await fetch(input,{...init,signal:controller.signal});}finally{clearTimeout(timer);init?.signal?.removeEventListener('abort',abort);}}},auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
