# V&B Fit — verificação da versão inicial

## Evidências executadas

- Build de produção com TypeScript estrito e Vite.
- 42 testes automatizados: 7 de domínio, 4 de fila offline/privacidade, 7 de renderização, 4 de viewport/teclado, 16 de confirmação/recuperação pelo link de e-mail e 4 de cobertura/integridade/renderização das imagens.
- Teste integrado real em PostgreSQL/Supabase com dois usuários temporários, dentro de transação revertida: RLS, tentativa de propriedade forjada, FKs por proprietário, sessão ativa única, upsert de série, refeições, suplemento, criação/aceitação/reutilização de convite, privacidade inicial, compartilhamento autorizado, desfazer vínculo e bloqueio anônimo.
- Auditor de segurança Supabase: nenhum alerta após a migration de hardening.
- Edge Function de exclusão de conta publicada, com validação do usuário autenticado.

## Limites da verificação

A tela pública de acesso foi inspecionada no navegador, conforme evidência abaixo. Ainda não foi executado teste autenticado completo nem teste de envio real de e-mail. Os testes de renderização verificam a saída React, não substituem a avaliação visual no celular. Instalação de PWA, uso em iOS/Android e envio de confirmação/recuperação devem ser validados nos dispositivos finais.

A configuração de Site URL/Redirect URLs do Supabase não é exposta pelo conector disponível. O redirecionamento normal deve apontar para a URL final da Vercel antes de ser considerado validado. Há um caminho alternativo por link colado no app, descrito abaixo.

O design local de referência está em `docs/design`. O canvas MagicPath foi criado, mas o envio dos arquivos foi bloqueado pela conectividade do ambiente; o fallback inline retornou `COMPONENT_ARCHIVE_MISSING`. Isso não interfere no código do aplicativo ou no deployment Vercel.

O endpoint de exclusão foi revisado e publicado, mas uma exclusão real de conta por HTTP não foi executada neste ambiente. As remoções por cascade foram verificadas na estrutura e os testes usam transações revertidas.

## Recursos deliberadamente limitados no MVP

- Lembretes dentro do aplicativo aberto, sem push externo.
- Imagens ilustrativas licenciadas para os 19 exercícios do catálogo; sem vídeos no MVP.
- Fotos sempre privadas; o compartilhamento de medidas não compartilha fotos.
- Exportação em JSON; fotos são salvas separadamente pela visualização privada.
- Históricos da interface limitados; exportação paginada completa.
- Sem inteligência artificial ou chamadas a provedores de IA.

## Serviços

- GitHub: `dw-glitch/VB-Fit` (independente dos outros aplicativos).
- Supabase: projeto exclusivo V&B FIT, região São Paulo.
- Vercel: projeto `vb-fit`, equipe `bibiaprojetos`.

Nenhum serviço adicional de IA, SMS ou push pago foi contratado. O uso segue os planos e limites já existentes dessas contas. Não foram estimados preços sem consultar o contrato de cada serviço.


## Revisão para uso exclusivo em celular

- Layout compacto único, com largura máxima de 480 px inclusive ao visualizar em computador.
- Alvos de toque ampliados, campos de 16 px, barra inferior com safe area, formulários de uma coluna abaixo de 360 px e controles semanais em sete colunas.
- Ações de hábitos reorganizadas para não comprimir os nomes; refeições empilhadas; teclado numérico nas séries mantido.
- Detecção da área visível para ajustar folhas de edição e ocultar a navegação atrás do teclado.
- Quatro testes adicionais de teclado/viewport (22 testes no total).
- O painel Supabase foi aberto pelo navegador e o acesso seguro foi submetido. O site exigiu hCaptcha antes de liberar o painel. Nenhuma URL de autenticação foi alterada nessa etapa; depende da conclusão dessa verificação humana.

### Conferência da tela de acesso publicada

A tela foi carregada no navegador após o deployment do commit `7e139a8`. A inspeção do DOM confirmou conteúdo compacto de 480 px, campos de 48 px com fonte de 16 px, botão principal de 44 px e largura de rolagem igual à largura visível da página. A captura está em `docs/mobile-login.jpg`. Essa evidência cobre a tela de acesso; os módulos autenticados e aparelhos físicos ainda não foram testados no navegador.

## Alternativa ao painel Supabase indisponível

- O painel continuou bloqueado na etapa de autenticação; nenhuma configuração administrativa de Auth foi alterada.
- A opção **Usar link do e-mail** troca o token hash do link original diretamente por uma sessão usando o SDK oficial, sem seguir o redirecionamento. O usuário precisa receber o e-mail e copiar o endereço do botão sem consumi-lo.
- Origem e caminho exatos são validados. Links de outros projetos, HTTP, credenciais na URL, tipos não suportados e parâmetros duplicados são recusados antes de qualquer requisição. O link só existe em estado transitório do formulário; não é gravado em URL, cache ou logs.
- Testes com transporte HTTP simulado e SDK real verificam POST de confirmação, sessão retornada, evento PASSWORD_RECOVERY e recusa de link expirado sem sessão. A tela de recuperação é remontada com estado limpo antes da nova senha.
- Reenvio de confirmação e novo pedido de recuperação estão disponíveis. Nenhum e-mail real foi disparado nos testes. A entrega e eventuais restrições de destinatário/SMTP ainda precisam de validação real.

A atualização foi publicada na Vercel no commit `98471ce`. A opção foi aberta pela tela pública de produção; o DOM confirmou canvas de 480 px, campo de 16 px, botão de 44 px e nenhuma rolagem horizontal. Captura: `docs/mobile-email-link.jpg`. Essa conferência não enviou e-mail nem iniciou sessão real.

## Imagens dos exercícios

- Os 19 exercícios receberam referências visuais locais da coleção Workout Guide, por Bryl Lim / Everkinetic, sob CC BY-SA 4.0. Créditos originais, links e hashes preservados.
- Imagens visíveis nas fichas, seleção de exercício, treino em andamento e histórico; toque amplia sem abrir outro modal ou perder os campos de séries.
- Guia público em `/exercicios`, com busca por exercício, músculo ou equipamento, disponível antes do login e pelo módulo Treinos. Não expõe dados de usuários.
- Testes conferem a cobertura de todos os IDs da migration do catálogo, integridade dos 19 PNGs, renderização do guia e presença da imagem na ficha salva e no treino ativo. Exercícios sem correspondência não recebem imagens de outro exercício.
- Build inclui os 19 PNGs (435.177 bytes somados) no cache estático da PWA. Cargas e dados privados continuam fora do Cache Storage.
