# V&B Fit — verificação da versão inicial

## Evidências executadas

- Build de produção com TypeScript estrito e Vite.
- 18 testes automatizados: 7 de regras de domínio, 4 de fila offline/privacidade do cache e 7 de renderização das telas com conta vazia.
- Teste integrado real em PostgreSQL/Supabase com dois usuários temporários, dentro de transação revertida: RLS, tentativa de propriedade forjada, FKs por proprietário, sessão ativa única, upsert de série, refeições, suplemento, criação/aceitação/reutilização de convite, privacidade inicial, compartilhamento autorizado, desfazer vínculo e bloqueio anônimo.
- Auditor de segurança Supabase: nenhum alerta após a migration de hardening.
- Edge Function de exclusão de conta publicada, com validação do usuário autenticado.

## Limites da verificação

Não foi executado teste interativo em navegador nem teste de envio real de e-mail. Os testes de renderização verificam a saída React, não substituem a avaliação visual no celular. Instalação de PWA, uso em iOS/Android e envio de confirmação/recuperação devem ser validados nos dispositivos finais.

A configuração de Site URL/Redirect URLs do Supabase não é exposta pelo conector disponível. Ela deve apontar para a URL final da Vercel antes de considerar a autenticação por e-mail totalmente validada.

O design local de referência está em `docs/design`. O canvas MagicPath foi criado, mas o envio dos arquivos foi bloqueado pela conectividade do ambiente; o fallback inline retornou `COMPONENT_ARCHIVE_MISSING`. Isso não interfere no código do aplicativo ou no deployment Vercel.

O endpoint de exclusão foi revisado e publicado, mas uma exclusão real de conta por HTTP não foi executada neste ambiente. As remoções por cascade foram verificadas na estrutura e os testes usam transações revertidas.

## Recursos deliberadamente limitados no MVP

- Lembretes dentro do aplicativo aberto, sem push externo.
- Sem mídia demonstrativa de exercícios enquanto não houver fonte e licença verificadas.
- Fotos sempre privadas; o compartilhamento de medidas não compartilha fotos.
- Exportação em JSON; fotos são salvas separadamente pela visualização privada.
- Históricos da interface limitados; exportação paginada completa.
- Sem inteligência artificial ou chamadas a provedores de IA.

## Serviços

- GitHub: `dw-glitch/VB-Fit` (independente dos outros aplicativos).
- Supabase: projeto exclusivo V&B FIT, região São Paulo.
- Vercel: projeto `vb-fit`, equipe `bibiaprojetos`.

Nenhum serviço adicional de IA, SMS ou push pago foi contratado. O uso segue os planos e limites já existentes dessas contas. Não foram estimados preços sem consultar o contrato de cada serviço.
