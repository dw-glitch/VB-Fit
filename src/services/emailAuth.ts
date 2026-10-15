import type {SupabaseClient} from '@supabase/supabase-js';

/** Read only this project's original email link; never navigate to a pasted URL. */
export function parseEmailLink(value:string,projectUrl:string){
 let url:URL;
 try{url=new URL(value.trim());}catch{throw new Error('Cole o endereço completo do botão recebido no e-mail.');}
 const project=new URL(projectUrl);
 if(url.protocol!=='https:'||url.origin!==project.origin||url.username||url.password||url.pathname!=='/auth/v1/verify'){
  throw new Error('Use o link original do e-mail do V&B Fit. Este endereço não pertence ao aplicativo.');
 }
 const token=url.searchParams.getAll('token'),types=url.searchParams.getAll('type');
 if(token.length!==1||!token[0]||token[0].length>1024||types.length!==1||!['email','signup','recovery'].includes(types[0])){
  throw new Error('Este link não serve para confirmar a conta ou recuperar a senha. Copie novamente o botão do e-mail.');
 }
 return {token_hash:token[0],type:types[0] as 'email'|'signup'|'recovery'};
}

export async function redeemEmailLink(value:string,projectUrl:string,auth:Pick<SupabaseClient['auth'],'verifyOtp'>){
 const params=parseEmailLink(value,projectUrl);
 const {data,error}=await auth.verifyOtp(params);
 if(error)throw error;
 if(!data.session)throw new Error('Não foi possível iniciar a sessão. Solicite um novo link e tente novamente.');
 return data;
}

export function authError(error:unknown){
 const code=error&&typeof error==='object'&&'code' in error?String(error.code):'';
 const message=error instanceof Error?error.message:'';
 if(code==='otp_expired'||/expired|invalid.*token|token.*invalid/i.test(message))return 'O link expirou ou já foi usado. Se estava confirmando a conta, tente entrar com sua senha. Para recuperar o acesso, peça outro link e copie sem abri-lo.';
 if(code==='over_email_send_rate_limit'||code==='over_request_rate_limit'||/rate limit/i.test(message))return 'O envio de e-mails está temporariamente limitado. Aguarde antes de pedir outro link.';
 if(/Invalid login/.test(message))return 'E-mail ou senha incorretos.';
 if(/Email not confirmed/.test(message))return 'Confirme seu e-mail antes de entrar. Você também pode usar o link do e-mail aqui no aplicativo.';
 if(/fetch|network|aborted|timeout/i.test(message))return 'A conexão demorou demais. Confira sua internet e tente novamente.';
 return message||'Não foi possível continuar.';
}
