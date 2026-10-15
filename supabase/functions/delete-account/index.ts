import { createClient } from 'npm:@supabase/supabase-js@2.95.3';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json'};
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers});
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{headers,status});
 if(req.method!=='POST')return reply({error:'Método não permitido'},405);
 const authorization=req.headers.get('Authorization');if(!authorization?.startsWith('Bearer '))return reply({error:'Acesso negado'},401);
 const jwt=authorization.slice(7);
 const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await admin.auth.getUser(jwt);if(error||!user)return reply({error:'Sessão inválida. Entre novamente.'},401);
 let body;try{body=await req.json();}catch{return reply({error:'Confirmação inválida'},400);}
 if(body.confirmation!=='EXCLUIR')return reply({error:'Confirmação inválida'},400);
 // Remove every object owned by the caller, including any upload orphaned by an interrupted request.
 for(;;){const {data:files,error:listError}=await admin.storage.from('private-photos').list(user.id,{limit:100});if(listError)return reply({error:'Não foi possível verificar suas fotos. Tente novamente.'},500);if(!files?.length)break;const {error:removeError}=await admin.storage.from('private-photos').remove(files.map(f=>`${user.id}/${f.name}`));if(removeError)return reply({error:'Não foi possível remover suas fotos. Tente novamente.'},500);}
 // End all refresh sessions first; foreign-key cascades remove all remaining personal rows.
 const {error:signoutError}=await admin.auth.admin.signOut(jwt,'global');if(signoutError)return reply({error:'Não foi possível encerrar suas sessões. Tente novamente.'},500);
 const {error:deleteError}=await admin.auth.admin.deleteUser(user.id);if(deleteError)return reply({error:'Não foi possível concluir a exclusão. Entre novamente e tente de novo.'},500);
 return reply({deleted:true});
});
