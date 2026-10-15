# V&B Fit — Nossa Evolução

PWA para uso exclusivo em celular, em português, para organizar treinos, alimentação, hábitos e evolução, com contas independentes e vínculo opcional de casal. React + TypeScript + Vite, Supabase Auth/PostgreSQL/Storage e publicação na Vercel. Sem IA no MVP.

## Executar

Requer Node 22 ou 24. Rode `npm ci`, copie `.env.example` para `.env.local`, configure a URL do projeto Supabase e sua chave **publishable**, e execute `npm run dev`. `npm test` executa regras determinísticas; `npm run build` verifica TypeScript e gera `dist/`.

Nunca coloque chaves administrativas no frontend ou no Git. As chaves públicas dependem das políticas RLS para isolar os dados.

## Supabase

Use um projeto exclusivo. Migrations versionadas em `supabase/migrations`. A primeira migration foi aplicada pelo conector e seu identificador foi obtido do histórico remoto, pois o download do binário da CLI estava indisponível no ambiente inicial.

Em um ambiente com a CLI oficial, consulte `supabase --help`, vincule o projeto e aplique migrations com `supabase db push`. Para mudanças futuras, gere nomes com `supabase migration new <nome>`. O catálogo contém somente texto de orientação; nenhuma mídia não licenciada é incluída.

Configure **Authentication → URL Configuration** com a URL de produção do aplicativo em Site URL e Redirect URLs. Inclua também `http://localhost:5173` para desenvolvimento quando necessário. Ative e-mail/senha e confirmação de e-mail; configure SMTP próprio se os limites do serviço padrão impedirem envio. O aplicativo passa a origem atual como destino de confirmação e recuperação; essa origem precisa ser autorizada.

Quando o botão do e-mail não retorna ao app, a tela **Usar link do e-mail** permite copiar o endereço original do botão de confirmação/recuperação e verificá-lo diretamente com `verifyOtp`. Só aceita HTTPS, a origem exata deste projeto e os tipos `email`, `signup` e `recovery`. Não segue `redirect_to`, não grava o link em URL/cache e não usa chaves administrativas. Links já consumidos/expirados exigem um novo envio; a tela oferece reenvio de confirmação e recuperação. Isso mantém a confirmação de propriedade do e-mail e dispensa o redirecionamento nesse caminho, mas não corrige configurações do painel nem limites/restrições do serviço de e-mail.

Publique `supabase/functions/delete-account/index.ts` como Edge Function `delete-account`. Ela verifica o bearer token com `auth.getUser`, remove fotos privadas, encerra sessões e exclui exclusivamente o próprio usuário. Somente a função recebe a service role, pelas variáveis internas do Supabase. Nunca configure essa chave na Vercel.

O bucket `private-photos` é privado, limitado a 5 MB e JPG/PNG/WebP. Políticas validam a pasta com o UUID do usuário. URLs assinadas duram 5 minutos; fotos não são compartilhadas com o casal.

## Publicação

Importe este repositório na Vercel usando o preset Vite, `npm run build`, saída `dist`. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` como configurações públicas do cliente. Variáveis de build exigem novo deployment quando alteradas. `vercel.json` configura cabeçalhos e a aplicação estática. A saída também pode ser hospedada em Cloudflare sem reescrita dos módulos.

## Módulos

- Hoje: rotina do dia, resumo semanal e atalhos.
- Treinos: fichas editáveis/duplicáveis/arquiváveis, calendário, sessões com snapshot, cargas/repetições, descanso, histórico e progressão por regras. Ao iniciar o treino, a tela abre no primeiro exercício, com imagem ao lado do nome, séries abaixo e botões Anterior/Próximo. Somente um exercício fica visível por vez; os valores ainda não concluídos permanecem ao voltar. Imagens dos 19 exercícios também aparecem nas fichas, na edição e no histórico; toque para ampliar.
- Alimentação: refeições recorrentes, favoritas, lanche levado/consumido e alertas indicativos de restrição.
- Hábitos e recuperação: rotinas, suplementação com dose cadastrada pelo usuário, sono e disposição.
- Evolução: medidas datadas, períodos, cargas, frequência e fotos privadas.
- Nós: convite de uso único válido por 48h, vínculo de duas pessoas, compartilhamento seletivo, metas e mural.
- Perfil: preferências, aparência, lembretes internos, exportação JSON e exclusão de conta.

## Offline e PWA

O service worker guarda somente shell e recursos estáticos da mesma origem. Requisições Supabase não entram no Cache Storage. O IndexedDB mantém o cache privado por UUID e uma fila persistente de séries, gravada antes do envio. Resumos do par e conteúdo compartilhado não entram no cache offline. Ao reconectar, a fila sincroniza com chaves únicas de sessão/exercício/série. Finalizar uma sessão exige sincronização. Ao sair, os dados locais são limpos; sair é bloqueado se houver séries ainda não enviadas.

Não há push externo no MVP. Os lembretes aparecem dentro do aplicativo aberto; permissões de notificação não são pedidas sem utilidade. Instalação depende do navegador. Não há recarregamento automático ao atualizar o service worker.

## Segurança e privacidade

Tabelas pessoais com RLS por `auth.uid()`, FKs compostas impedindo cruzamento de proprietários e validações no banco. O vínculo não permite ler as tabelas pessoais do par: somente uma RPC fornece resumos explicitamente autorizados. Peso e medidas iniciam privados. Convites armazenam apenas hash; aceitação usa locks, expiração e validação de uso único. Desvincular remove o conteúdo compartilhado e mantém dados individuais.

Cache local é voltado a dispositivos pessoais. O backend é a fonte de verdade. Não há telemetria com informações pessoais ou modelos de IA. A exportação JSON contém registros e referências das fotos; imagens podem ser abertas individualmente na tela Evolução. A exclusão de conta remove os dados ativos; retenção de backups segue o plano/configuração do provedor.

## Manutenção e expansão

Domínios em `src/features`, acesso aos dados em `src/services`, regras determinísticas em `src/lib/domain.ts`, componentes acessíveis em `src/components`. Novos provedores de IA devem entrar por backend próprio, com consentimento, limite de custo e possibilidade de desligar. Nenhum fluxo atual depende de IA.

Os históricos carregados na interface têm limites operacionais (300 sessões, 3.000 séries e 365 medições/check-ins). A exportação pessoal pagina todos os registros. Uma versão futura pode adicionar paginação visual e filtros no servidor para históricos extensos.


## Uso em celular

A interface usa a mesma estrutura compacta em todas as larguras e fica limitada a 480 px quando aberta em uma tela maior. A navegação inferior respeita a área segura do aparelho; alvos principais têm pelo menos 44 px e campos usam 16 px para evitar zoom involuntário ao editar no iPhone. Em larguras abaixo de 360 px os formulários passam para uma coluna. Os sete dias da semana permanecem em uma linha.

`useMobileViewport` acompanha a área visível e oculta a navegação enquanto o teclado está aberto. As folhas de edição se ajustam à altura disponível. Isso é uma adaptação de layout; a instalação da PWA e o teclado de cada versão de iOS/Android ainda exigem conferência no aparelho.

## Guia visual de exercícios

`/exercicios` é um guia público do catálogo, sem dados de contas, com busca por nome, grupo muscular e equipamento. Também é acessível pela tela de entrada e por Treinos. As imagens são locais, totalizam aproximadamente 435 kB e entram no cache estático da PWA; não dependem de servidor de imagens externo. Créditos e licença CC BY-SA 4.0 aparecem ao ampliar. Origem, hashes e termos estão em `docs/EXERCISE-MEDIA.md` e `src/data/exercise-media.json`.

## Montagem automática de treinos

Em Treinos, **Montar meu treino** é a ação principal. Contas sem fichas abrem esse fluxo diretamente, inclusive ao concluir o perfil. O usuário pode escrever uma descrição e confirmar objetivo, experiência, dias, tempo, horário, quantidade de séries e exercícios a evitar. O aplicativo monta e mostra as fichas, com imagens, antes de salvar. **Salvar e começar meu treino** grava todas as fichas e abre o primeiro exercício. Durante um treino ativo, o gerador salva o próximo plano para depois.

A montagem usa regras locais e o catálogo de 19 exercícios de academia; não depende de IA ou serviço pago. A leitura de texto extrai informações explícitas reconhecidas e as expõe em campos editáveis. Não é interpretação irrestrita de linguagem natural. O gerador suporta de 1 a 6 dias, 20 a 120 minutos e 2 a 4 séries. Até três dias usam corpo inteiro em dias intercalados; quatro ou mais alternam superiores/inferiores. Respeita exclusões e recusa combinações sem cobertura suficiente. Não calcula carga máxima, não adapta lesões e não oferece um catálogo completo para casa.

A RPC `save_workout_plan` salva o lote em uma transação com RLS e pode iniciar a sessão na mesma transação. UUIDs são preservados ao repetir um envio após falha, evitando duplicação. Fichas anteriores e históricos são mantidos. A descrição, inclusive eventuais informações clínicas, fica somente no formulário: apenas as fichas geradas são enviadas ao banco.

Fontes das orientações gerais e limites do gerador: `docs/WORKOUT-GENERATOR.md`.
