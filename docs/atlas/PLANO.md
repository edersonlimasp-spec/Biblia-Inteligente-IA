# Plano do Atlas bíblico

## Objetivo e estado desta etapa

O Atlas é um catálogo de mapas históricos, geografia física e ilustrações
didáticas para estudo bíblico. Esta etapa corrige o contrato de organização e
registra o catálogo completo; somente os dez mapas marcados como
`disponivel` têm conteúdo JSON amostral. A visão geral do Tabernáculo é
intencionalmente `pendente`, embora tenha `sample: true`: ela representa uma
amostra planejada, não um arquivo que já exista. Não há SVG de ilustração
disponível nesta etapa.

O manifesto canônico é `data/atlas/manifest.json`. Seu `expectedAvailable`
deve permanecer igual ao número de itens com `status: "disponivel"` (10).
Itens pendentes não devem aparecer como conteúdo carregável, e nenhum mapa
pendente deve receber coordenadas inventadas ou uma afirmação de revisão por
especialista.

## Ordem editorial

As seções do catálogo aparecem nesta ordem:

1. **Antigo Testamento**, com Origens e patriarcas; Êxodo e deserto;
   Conquista e juízes; Reino unido; Reino dividido; Impérios e exílio;
   Retorno.
2. **Entre os Testamentos**.
3. **Novo Testamento**, com Vida de Jesus; Igreja primitiva; Viagens de
   Paulo; Epístolas e Apocalipse.
4. **Jerusalém através do tempo**.
5. **Tabernáculo**.
6. **Templo de Salomão**.
7. **Geografia física**.

O campo `order` é cronológico dentro da seção/subseção quando a cronologia é
significativa; nos demais casos é a ordem didática. Uma ordem de catálogo não
é uma afirmação de datação histórica.

## Catálogo planejado

### Antigo Testamento

**Origens e patriarcas**

- Mundo do Antigo Oriente Próximo (amostra, disponível).
- Tabela das nações de Gn 10.
- Jornadas de Abraão (amostra, disponível).
- Isaque e Jacó.
- José e a ida de Israel ao Egito.

**Êxodo e deserto**

- Êxodo: hipóteses de rota (amostra, disponível).
- Peregrinação no deserto (Nm 33) e Cades.
- Acampamento das tribos ao redor do Tabernáculo (Nm 2, diagrama).

**Conquista e juízes**

- Conquista de Canaã (campanhas central, sul e norte).
- Divisão das 12 tribos (amostra, disponível).
- Cidades de refúgio e levíticas.
- Período dos juízes.

**Reino unido**

- Samuel e Saul.
- Davi, da fuga ao trono.
- Reino unido de Davi e Salomão.

**Reino dividido**

- Reino dividido (amostra, disponível).
- Elias e Eliseu.
- Os profetas no mapa.

**Impérios e exílio**

- Império Assírio e queda de Samaria.
- Império Babilônico e exílio.
- Jonas.

**Retorno**

- Império Persa e retorno (Esdras, Neemias, Ester).

### Entre os Testamentos

- Ptolomeus, Selêucidas e Macabeus.

### Novo Testamento

**Vida de Jesus**

- Reino de Herodes e divisão entre os filhos.
- Palestina no tempo de Jesus (amostra, disponível).
- Nascimento e infância de Jesus.
- Ministério na Galileia.
- Decápolis, Tiro, Sidom e Pereia.
- Última semana e ressurreição.

**Igreja primitiva**

- Pentecostes: as nações de At 2.
- Igreja em At 1–12.

**Viagens de Paulo**

- Primeira viagem missionária de Paulo (amostra, disponível).
- Segunda viagem.
- Terceira viagem.
- Viagem a Roma.

**Epístolas e Apocalipse**

- Destinatários das epístolas.
- Sete igrejas do Apocalipse (amostra, disponível).
- Império Romano no século I (amostra, disponível).

### Jerusalém através do tempo

- Cidade de Davi.
- Salomão.
- Ezequias.
- Neemias.
- Tempo de Jesus (amostra, disponível).
- 70 d.C. e Aelia Capitolina.

### Geografia física

- Relevo e regiões da Terra Santa: Sefelá, Neguebe, Arabá, vale do Jordão,
  Galileia e Transjordânia.
- Mares, rios e montes da Bíblia.

### Tabernáculo

- Visão geral (amostra planejada, pendente).
- Pátio e cercado.
- Porta do pátio.
- Altar do holocausto.
- Pia de bronze.
- Estrutura: tábuas, bases de prata e travessas.
- As quatro cobertas.
- Véu e cortina da entrada.
- Candelabro.
- Mesa dos pães.
- Altar do incenso.
- Arca e propiciatório com querubins.
- Vestes do sumo sacerdote (conjunto).
- Éfode e cinto.
- Peitoral com 12 pedras.
- Manto azul com romãs e campainhas.
- Mitra e lâmina de ouro.
- Túnica, cinto e calções.
- Vestes dos sacerdotes comuns.

### Templo de Salomão

- Visão geral.
- Planta.
- Pórtico (ulam).
- Lugar Santo (hekal), com 10 candelabros e 10 mesas.
- Santo dos Santos (debir) e querubins.
- Câmaras laterais.
- Colunas Jaquim e Boaz.
- Mar de fundição com 12 bois.
- As 10 bases com rodas.
- As 10 pias.
- Altar de bronze.
- Pátios.
- Comparação Tabernáculo x Templo.

## Evidência, licenças e limites

Os mapas disponíveis são uma compilação editorial rastreável, não um atlas
arqueológico certificado. Coordenadas de OpenBible.info e Pleiades são pontos
representativos; linhas e áreas são geometrias didáticas. Rotas retas não são
estradas, trilhas GPS ou itinerários medidos. Hipóteses devem permanecer
rotuladas como prováveis, debatidas ou desconhecidas, e lugares sem
identificação segura devem permanecer sem coordenadas.

As fontes retidas no repositório devem declarar suas licenças e atribuições:
Natural Earth (domínio público) para a base moderna, OpenBible.info (CC BY
4.0) e Pleiades (CC BY 3.0). A base Natural Earth é apenas orientação
contemporânea; ela não prova fronteiras antigas, soberania ou localização de
um episódio bíblico. Textos bíblicos devem continuar referenciados sem
reproduzir traduções protegidas.

Ilustrações futuras serão SVGs originais, com peças clicáveis, medidas em
côvados quando a fonte fornecer medida, material, referências e área de
destaque. Conversões métricas serão apresentadas como aproximadas; ausência
de medida não deve ser preenchida por estimativa escondida.

## Etapas de implementação

1. Validar o manifesto e gerar os dez JSON amostrais a partir das evidências
   preservadas; criar diretórios de ilustrações e SVG sem fingir conteúdo.
2. Fazer o servidor carregar arquivos válidos, registrar arquivos inválidos e
   continuar com o catálogo válido quando diretórios estiverem vazios ou
   ausentes.
3. Expandir schema e resumos com seção, ordem, era, panorama moderno,
   referências-chave e aliases; validar manifesto, JSON e SVG referenciado
   em testes.
4. Organizar o catálogo em seções e subseções cronológicas; em produção,
   ocultar seções sem conteúdo; em desenvolvimento, indicar “Em breve”.
5. Implementar a ficha com “Como era”, “Como é hoje” e comparação, incluindo
   mapa local sem servidor de tiles público, fontes, incerteza, referências,
   lugares e assistente existente.
6. Adicionar as ilustrações do Tabernáculo e do Templo somente depois de
   preparar fontes, revisão editorial e SVGs originais correspondentes.
7. Rodar a suíte completa, revisar visualmente web/TWA/WebView iOS e só então
   submeter para revisão do dono. Esta etapa não publica o projeto.

## Critérios de aceitação

- `GET /api/atlas/catalog` responde 200 mesmo quando uma pasta é ausente ou
  vazia, contendo apenas arquivos válidos e registrando os inválidos.
- Os dez IDs disponíveis do manifesto carregam, passam pelo schema e possuem
  panorama moderno de 3–6 frases, referências-chave e aliases.
- Nenhum item pendente é servido como se estivesse disponível; o Tabernáculo
  planejado permanece pendente até existirem JSON e SVG correspondentes.
- A tela ordena as seções, filtra AT/NT, época e disponibilidade, e leva itens
  bloqueados à tela de assinaturas existente.
- A comparação histórica diferencia nomes/rotas antigas da orientação moderna,
  mantém atribuições visíveis, oferece áreas de toque acessíveis e não usa
  tiles remotos.
- Referências tocáveis reutilizam a navegação bíblica existente quando houver
  destino compatível; perguntas usam somente `POST /api/ai/ask` e o contexto
  validado do Atlas.
- Nenhuma alteração é feita em preços, planos, checkout, pagamentos,
  webhooks, lojas, Clerk, painel admin, `/oferta`, Google Ads ou tela de
  assinaturas.

## Preservação de autenticação, IA e publicação

O Atlas reutiliza as regras de acesso e a tela de assinaturas já existentes.
Não cria tabela, migração, rota de IA nova ou quota nova. A divergência de
quota já documentada em `docs/atlas/integration.md` permanece documentada e
não é corrigida neste plano. O projeto não deve ser publicado nesta etapa;
o dono revisará conteúdo, fontes, incertezas, testes e visual antes da
publicação.