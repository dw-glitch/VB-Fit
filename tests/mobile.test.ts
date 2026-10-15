import {describe,it,expect} from 'vitest';
import {mobileViewportState} from '../src/hooks/useMobileViewport';
describe('Teclado e viewport do celular',()=>{
 it('remove a navegação inferior quando o teclado reduz a área de edição',()=>expect(mobileViewportState(844,480,true)).toEqual({height:480,keyboardOpen:true}));
 it('não trata a barra do navegador como teclado',()=>expect(mobileViewportState(844,790,true).keyboardOpen).toBe(false));
 it('mantém a navegação ao redimensionar sem um campo em edição',()=>expect(mobileViewportState(844,480,false).keyboardOpen).toBe(false));
 it('funciona em aparelhos compactos',()=>expect(mobileViewportState(640,350,true).keyboardOpen).toBe(true));
});
