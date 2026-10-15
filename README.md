# V&B Fit — Nossa Evolução

PWA pessoal em português para organizar treinos, alimentação, hábitos e evolução, com contas independentes e vínculo opcional de casal. React + TypeScript + Vite, Supabase Auth/PostgreSQL/Storage e publicação na Vercel. Sem IA no MVP.

## Executar

Requer Node 22 ou 24. Rode `npm ci`, copie `.env.example` para `.env.local`, configure a URL do projeto Supabase e sua chave **publishable**, e execute `npm run dev`. `npm test` executa regras determinísticas; `npm run build` verifica TypeScript e gera `dist/`.

Nunca coloque chaves administrativas no frontend ou no Git. As chaves públicas dependem das políticas RLS para isolar os dados.

## Supabase

Use um projeto exclusivo. Migrations versionadas em `supabase/migrations`. A primeira migration foi aplicada pelo conector e seu identificador foi obtido do histórico remoto, pois o download do binário da CLI estava indisponível no ambiente inicial.

Em um ambiente com a CLI oficial, consulte `supabase --help`, vincule o projeto e aplique migrations com `supabase db push`. Para mudanças futuras, gere nomes com `supabase migration new <nome>`. O catálogo contém somente texto de orientação; nenhuma mídia não licenciada é incluída.

Configure **Authentication → URL Configuration** com a URL de produção do aplicativo em Site URL e Redirect URLs. Inclua também `http://localhost:5173` para desenvolvimento quando necessário. Ative e-mail/senha e confirmação de e-mail; configure SMTP próprio se os limites do serviço padrão impedirem envio. O aplicativo passa a origem atual como destino de confirmação e recuperação; essa origem precisa ser autorizada.

Publique `supabase/functions/delete-account/index.ts` como Edge Function `delete-account`. Ela verifica o bearer token com `auth.getUser`, remove fotos privadas, encerra sessões e exclui exclusivamente o próprio usuário. Somente a função recebe a service role, pelas variáveis internas do Supabase. Nunca configure essa chave na Vercel.

O bucket `private-photos` é privado, limitado a 5 MB e JPG/PNG/WebP. Políticas validam a pasta com o UUID do usuário. URLs assinadas duram 5 minutos; fotos não são compartilhadas com o casal.

## Publicação

Importe este repositório na Vercel usando o preset Vite, `npm run build`, saída `dist`. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` como configurações públicas do cliente. Variáveis de build exigem novo deployment quando alteradas. `vercel.json` configura cabeçalhos e a aplicação estática. A saída também pode ser hospedada em Cloudflare sem reescrita dos módulos.

## Módulos

- Hoje: rotina do dia, resumo semanal e atalhos.
- Treinos: fichas editáveis/duplicáveis/arquiváveis, calendário, sessões com snapshot, cargas/repetições, descanso, histórico e progressão por regras.
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
