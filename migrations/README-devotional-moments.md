# Meu Momento com Deus — migração aditiva

`0004_devotional_moments.sql` cria somente:

- Conteúdo editorial por data e rotina, com rascunho/aprovação.
- Diário privado por usuário, data e rotina, com conclusão independente.

Não remove ou altera histórico da Mel, eventos `mel_devotional`, livros,
assinaturas, preços, pagamentos ou dados de autenticação.

Foi aplicada em **desenvolvimento**. A aplicação em **produção** permanece
sujeita à aprovação do responsável durante a publicação. Não foi incluída
nenhuma execução automática de SQL de produção na inicialização do servidor.

Se a migração ainda não estiver aplicada, a reserva editorial continua
disponível para leitura. O diário/editor retornam erro explícito e uma tentativa
de concluir não grava atividade na Mel antes de verificar o diário.

Os plugins nativos de compartilhamento são instalados pelos passos existentes
`cap sync` dos builds iOS e Android. É necessário gerar novos aplicativos nativos
para ter esses plugins; publicar apenas a web não altera um binário instalado.
O envio real de push depende da configuração Firebase/APNs existente.