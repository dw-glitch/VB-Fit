import {describe,it,expect,vi} from 'vitest';
import {createClient} from '@supabase/supabase-js';
import {parseEmailLink,redeemEmailLink,authError} from '../src/services/emailAuth';

const project='https://test-project.supabase.co';
const link=(type='email')=>`${project}/auth/v1/verify?token=synthetic-test-hash&type=${type}&redirect_to=http://localhost:3000`;

describe('Confirmação pelo link original do e-mail',()=>{
 it('extrai o token hash sem seguir um redirecionamento, mesmo se ele apontar para localhost',()=>{
  expect(parseEmailLink(` ${link()} `,project)).toEqual({token_hash:'synthetic-test-hash',type:'email'});
 });
 it.each(['signup','recovery'])('reconhece o tipo %s',type=>expect(parseEmailLink(link(type),project).type).toBe(type));
 it.each([
  'not a link',link().replace('test-project','another-project'),link().replace('https:','http:'),
  link().replace('/verify','/logout'),link().replace('https://','https://someone:password@'),
  link('invite'),link('email_change'),link()+'&type=recovery',link()+'&token=other',
  link().replace('token=synthetic-test-hash','token='),
 ])('recusa um link inválido antes de falar com o servidor (%#)',async value=>{
  const verifyOtp=vi.fn();await expect(redeemEmailLink(value,project,{verifyOtp})).rejects.toThrow();expect(verifyOtp).not.toHaveBeenCalled();
 });
 it.each([['email','SIGNED_IN'],['recovery','PASSWORD_RECOVERY']] as const)('troca %s por uma sessão usando o SDK real e emite %s',async(type,event)=>{
  const fetch=vi.fn(async()=>new Response(JSON.stringify({access_token:'synthetic-test-access-token',token_type:'bearer',refresh_token:'synthetic-test-refresh-token',expires_in:3600,user:{id:'test-user',aud:'authenticated',role:'authenticated',email:'qa@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-10-15T00:00:00Z'}}),{status:200,headers:{'Content-Type':'application/json'}}));
  const client=createClient(project,'synthetic-test-key',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch}});
  const events:string[]=[];const {data:{subscription}}=client.auth.onAuthStateChange(e=>{events.push(e);});
  try{
   const result=await redeemEmailLink(link(type),project,client.auth);
   expect(result.session?.user.id).toBe('test-user');expect(events).toContain(event);
   expect(fetch).toHaveBeenCalledTimes(1);
   const [requestUrl,request]=fetch.mock.calls[0] as unknown as [string,RequestInit];
   expect(requestUrl).toBe(`${project}/auth/v1/verify`);expect(request.method).toBe('POST');
   expect(JSON.parse(request.body as string)).toMatchObject({token_hash:'synthetic-test-hash',type});
   expect(request.body).not.toContain('localhost');
  }finally{subscription.unsubscribe();}
 });
 it('propaga um link expirado sem produzir sessão',async()=>{
  const client=createClient(project,'synthetic-test-key',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:async()=>new Response(JSON.stringify({code:'otp_expired',msg:'Token has expired or is invalid'}),{status:403,headers:{'Content-Type':'application/json'}})}});
  let failure:unknown;try{await redeemEmailLink(link(),project,client.auth);}catch(e){failure=e;}
  expect(authError(failure)).toContain('expirou ou já foi usado');expect((await client.auth.getSession()).data.session).toBeNull();
 });
});
