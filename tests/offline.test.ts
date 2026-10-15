import 'fake-indexeddb/auto';
import {beforeEach,describe,it,expect,vi} from 'vitest';
vi.mock('../src/services/data',()=>({save:vi.fn()}));
import {save} from '../src/services/data';
import {cacheData,clearPrivateDevice,pending,queueSet,readCache,syncQueue} from '../src/services/offline';
import type {AppData,PerformedSet} from '../src/types';
const row=(id:string,user='a'):PerformedSet=>({id,user_id:user,session_exercise_id:'exercise-'+id,set_number:1,weight_kg:20,reps:8,completed_at:new Date().toISOString()});
beforeEach(async()=>{await clearPrivateDevice();vi.mocked(save).mockReset();vi.mocked(save).mockResolvedValue([]);});
describe('Fila persistente de séries',()=>{
 it('preserva séries em caso de erro de rede e envia ao tentar novamente',async()=>{await queueSet(row('one'));vi.mocked(save).mockRejectedValueOnce(new Error('offline'));await expect(syncQueue('a')).rejects.toThrow('offline');expect(await pending('a')).toHaveLength(1);await syncQueue('a');expect(await pending('a')).toHaveLength(0);expect(save).toHaveBeenLastCalledWith('performed_sets',expect.objectContaining({id:'one'}),'session_exercise_id,set_number');});
 it('isola as filas por usuário e não duplica a mesma série',async()=>{await queueSet(row('one'));await queueSet({...row('one'),reps:10});await queueSet(row('two','b'));expect(await pending('a')).toHaveLength(1);await syncQueue('a');expect(await pending('b')).toHaveLength(1);expect(save).toHaveBeenCalledTimes(1);});
 it('esvazia séries adicionadas durante uma sincronização em andamento',async()=>{await queueSet(row('one'));let release:()=>void=()=>{};const block=new Promise<void>(resolve=>{release=resolve;});vi.mocked(save).mockImplementationOnce(async()=>{await block;return [];});const task=syncQueue('a');await new Promise(resolve=>setTimeout(resolve,10));await queueSet(row('two'));release();await task;expect(await pending('a')).toHaveLength(0);expect(save).toHaveBeenCalledTimes(2);});
 it('não mantém dados compartilhados no cache offline e limpa o dispositivo ao sair',async()=>{await cacheData('a',{profile:{name:'Conta A'},partner:{name:'Conta B',measurements:{weight_kg:70}},couple:{id:'couple'},goals:[{title:'compartilhada'}],achievements:[{message:'mensagem'}]} as AppData);const cached=await readCache('a');expect(cached?.partner).toBeNull();expect(cached?.goals).toEqual([]);expect(await readCache('b')).toBeUndefined();await clearPrivateDevice();expect(await readCache('a')).toBeUndefined();});
});
