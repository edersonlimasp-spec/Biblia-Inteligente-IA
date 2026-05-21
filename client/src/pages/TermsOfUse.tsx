import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface TermsOfUseProps {
  onBack?: () => void;
}

export function TermsOfUse({ onBack }: TermsOfUseProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (onBack ? onBack() : window.history.back())}
            data-testid="button-back-terms"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Termos de Uso</h1>
            <p className="text-sm text-muted-foreground">Bíblia Inteligente IA</p>
          </div>
        </div>
      </header>

      <article className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 text-sm leading-relaxed">
        <p className="text-muted-foreground">Última atualização: Maio de 2026</p>

        <section className="space-y-2">
          <p>
            Bem-vindo ao <strong>Bíblia Inteligente IA</strong> (o "App"). Estes Termos de Uso
            ("Termos") regulam o uso do App e dos serviços relacionados, oferecidos por meio
            de aplicativo móvel (iOS e Android) e website. Ao criar uma conta, instalar ou
            utilizar o App, você declara que leu, entendeu e concorda integralmente com
            estes Termos e com a nossa{" "}
            <a href="/privacidade" className="text-primary hover:underline">
              Política de Privacidade
            </a>
            . Se você não concorda com qualquer disposição, não utilize o App.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">1. Definições</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>App:</strong> aplicativo Bíblia Inteligente IA, em todas as suas versões e plataformas.</li>
            <li><strong>Usuário:</strong> pessoa física que utiliza o App, com ou sem conta cadastrada.</li>
            <li><strong>Conteúdo:</strong> textos bíblicos, traduções, dicionário Strong, comentários, respostas geradas por IA, áudios e demais materiais disponibilizados.</li>
            <li><strong>Assinatura:</strong> plano pago que libera recursos premium (IA avançada, Strong Vitalício, Modos de Estudo, etc.).</li>
            <li><strong>Lojas:</strong> Apple App Store e Google Play Store.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">2. Elegibilidade e Cadastro</h2>
          <p>
            O App pode ser utilizado por qualquer pessoa com idade igual ou superior a{" "}
            <strong>13 anos</strong>. Menores de 18 anos devem ter consentimento de responsável
            legal. Você é responsável pela veracidade dos dados informados no cadastro e por
            manter suas credenciais de acesso (e-mail e senha) em sigilo. Notifique-nos
            imediatamente em caso de uso não autorizado da sua conta.
          </p>
          <p>
            A leitura da Bíblia é gratuita e não exige cadastro. O Dicionário Strong e o
            Professor IA exigem login com nível de acesso variável conforme o plano.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">3. Planos e Assinaturas</h2>
          <p>
            O App oferece um plano gratuito com limitações e <strong>planos pagos</strong>{" "}
            (Gold, Premium e Strong Vitalício) com recursos adicionais. Preços, recursos
            inclusos e periodicidade são exibidos na tela de assinatura antes da compra.
          </p>
          <h3 className="text-base font-semibold mt-3">3.1. Forma de pagamento por plataforma</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>iOS (iPhone/iPad):</strong> processado exclusivamente pela{" "}
              <strong>Apple In-App Purchase (StoreKit)</strong>. A cobrança é feita pela Apple,
              conforme as condições do App Store.
            </li>
            <li>
              <strong>Android:</strong> processado pelo <strong>Google Play Billing</strong>.
              A cobrança é feita pelo Google, conforme as condições do Google Play.
            </li>
            <li>
              <strong>Website (navegador):</strong> processado pelo <strong>Mercado Pago</strong>{" "}
              (cartão, Pix e demais meios disponíveis).
            </li>
          </ul>

          <h3 className="text-base font-semibold mt-3">3.2. Renovação automática</h3>
          <p>
            Assinaturas mensais e anuais são renovadas automaticamente ao final de cada
            ciclo, salvo cancelamento prévio. O valor da renovação é o vigente na data da
            cobrança, podendo ser atualizado mediante aviso prévio de pelo menos 30 dias.
          </p>

          <h3 className="text-base font-semibold mt-3">3.3. Como cancelar</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>iOS:</strong> Ajustes → seu nome → Assinaturas → Bíblia Inteligente IA →
              Cancelar.
            </li>
            <li>
              <strong>Android:</strong> Google Play → ícone de perfil → Pagamentos e
              assinaturas → Assinaturas → Bíblia Inteligente IA → Cancelar.
            </li>
            <li>
              <strong>Web (Mercado Pago):</strong> acesse a área de assinaturas da sua conta
              Mercado Pago ou solicite cancelamento pelos canais de contato indicados na
              seção 12.
            </li>
          </ul>
          <p className="text-muted-foreground italic">
            O cancelamento interrompe a próxima renovação. O acesso aos recursos pagos
            permanece ativo até o fim do período já pago.
          </p>

          <h3 className="text-base font-semibold mt-3">3.4. Teste gratuito (free trial)</h3>
          <p>
            Quando oferecido, o teste gratuito é destinado apenas a novos assinantes e tem
            duração informada na tela de oferta. Para evitar cobrança, cancele antes do
            término do período de teste pelos mesmos canais descritos em 3.3.
          </p>

          <h3 className="text-base font-semibold mt-3">3.5. Reembolso e arrependimento</h3>
          <p>
            Conforme o Código de Defesa do Consumidor (art. 49), você tem direito de
            arrependimento em até <strong>7 dias corridos</strong> contados da contratação
            quando feita fora do estabelecimento (compras online). Solicitações de reembolso
            de compras feitas pela App Store ou Google Play devem ser direcionadas
            diretamente à <strong>Apple</strong> ou <strong>Google</strong>, conforme as
            políticas dessas plataformas. Compras feitas via Mercado Pago podem ser
            solicitadas pelos canais da seção 12.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">4. Uso Aceitável</h2>
          <p>É <strong>proibido</strong>:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Usar o App para fins ilegais, abusivos, difamatórios, discriminatórios ou que violem direitos de terceiros.</li>
            <li>Tentar burlar limites de uso da IA, sistemas de pagamento ou autenticação.</li>
            <li>Fazer engenharia reversa, descompilar, copiar ou redistribuir o código ou conteúdo do App.</li>
            <li>Compartilhar sua conta com terceiros ou revender o acesso.</li>
            <li>Utilizar bots, scrapers ou qualquer ferramenta automatizada para acessar o serviço.</li>
            <li>Sobrecarregar a infraestrutura por meio de requisições excessivas.</li>
            <li>Usar o App para gerar conteúdo ofensivo, falso ou que infrinja a legislação brasileira.</li>
          </ul>
          <p>
            Violações poderão resultar em suspensão imediata da conta, sem reembolso, e em
            adoção das medidas legais cabíveis.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">5. Professor IA — Limitações e Responsabilidade</h2>
          <p>
            O <strong>Professor IA</strong> é uma ferramenta de estudo baseada em modelos de
            linguagem (OpenAI). As respostas geradas:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Podem conter imprecisões, omissões ou erros factuais.</li>
            <li>Refletem padrões probabilísticos e não são opinião teológica oficial.</li>
            <li>
              <strong>NÃO substituem</strong> orientação pastoral, aconselhamento espiritual,
              parecer teológico, consulta profissional (jurídica, médica, psicológica) ou
              qualquer outra forma de assistência humana qualificada.
            </li>
          </ul>
          <p>
            Você reconhece e aceita que utiliza as respostas da IA por sua própria conta e
            risco. Recomendamos verificar fontes adicionais e consultar líderes religiosos
            de sua confiança para decisões importantes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">6. Conteúdo do Usuário</h2>
          <p>
            Anotações, marcações, gravações de áudio e outros conteúdos criados por você no
            App pertencem a <strong>você</strong>. Ao publicar ou compartilhar esse conteúdo
            por meio do App (por exemplo, compartilhamento de áudios), você concede ao Bíblia
            Inteligente IA uma licença não exclusiva, mundial e gratuita para armazenar,
            transmitir e exibir esse conteúdo exclusivamente para viabilizar o
            funcionamento do recurso.
          </p>
          <p>
            Você é o único responsável pelo conteúdo que produz e declara não violar
            direitos autorais, de imagem, privacidade ou quaisquer outros direitos de
            terceiros.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">7. Propriedade Intelectual</h2>
          <p>
            O nome <strong>Bíblia Inteligente IA</strong>, o logotipo, a interface, o código
            e os recursos exclusivos do App são protegidos por direitos autorais, marca
            registrada e demais leis aplicáveis, e pertencem aos seus respectivos titulares.
          </p>
          <p>
            Os <strong>textos bíblicos</strong> exibidos no App respeitam as licenças de
            cada versão (domínio público, licenças abertas ou autorização dos detentores).
            O <strong>Dicionário Strong</strong> em português usa traduções e referências
            licenciadas. Não é permitido extrair, redistribuir ou comercializar esses
            conteúdos sem autorização.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">8. Disponibilidade e Modificações</h2>
          <p>
            Buscamos manter o App disponível 24 horas por dia, mas não garantimos
            funcionamento ininterrupto. Manutenções programadas, atualizações ou falhas
            técnicas (próprias ou de terceiros como Apple, Google, Mercado Pago, OpenAI,
            provedores de nuvem) podem causar indisponibilidade temporária.
          </p>
          <p>
            Reservamo-nos o direito de modificar, suspender ou descontinuar recursos do App
            a qualquer momento, com aviso prévio sempre que possível.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">9. Encerramento da Conta</h2>
          <p>
            Você pode excluir sua conta a qualquer momento em{" "}
            <em>Configurações → Apagar conta</em>. A exclusão é definitiva e remove dados
            pessoais conforme descrito na Política de Privacidade. Assinaturas ativas devem
            ser canceladas separadamente nas Lojas (ver seção 3.3) — apagar a conta não
            cancela automaticamente a cobrança da Apple ou Google.
          </p>
          <p>
            Podemos suspender ou encerrar contas que violem estes Termos, sem aviso prévio
            em casos graves, e sem direito a reembolso.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">10. Limitação de Responsabilidade</h2>
          <p>
            Na máxima extensão permitida pela legislação aplicável, o Bíblia Inteligente IA
            não se responsabiliza por:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Decisões pessoais, religiosas, profissionais ou financeiras tomadas com base no conteúdo do App ou em respostas da IA.</li>
            <li>Perdas indiretas, lucros cessantes, danos morais ou consequenciais.</li>
            <li>Indisponibilidade causada por serviços de terceiros (Apple, Google, OpenAI, Mercado Pago, provedores de internet etc.).</li>
            <li>Perda de dados decorrente de falha do dispositivo do usuário ou exclusão de conta.</li>
          </ul>
          <p>
            Nossa responsabilidade máxima por qualquer disputa relacionada ao App está
            limitada ao valor efetivamente pago pelo usuário nos últimos 12 meses.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">11. Lei Aplicável e Foro</h2>
          <p>
            Estes Termos são regidos pelas leis da <strong>República Federativa do Brasil</strong>,
            em especial o Código de Defesa do Consumidor (Lei 8.078/1990), o Marco Civil da
            Internet (Lei 12.965/2014) e a Lei Geral de Proteção de Dados (Lei 13.709/2018).
            Fica eleito o foro do domicílio do consumidor para dirimir quaisquer controvérsias.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">12. Contato</h2>
          <p>Para dúvidas, solicitações, reembolsos ou exercício de direitos:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Instagram:{" "}
              <a
                href="https://instagram.com/bibliainteligenteia"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                data-testid="link-contact-terms"
              >
                @bibliainteligenteia
              </a>
            </li>
            <li>
              E-mail:{" "}
              <a
                href="mailto:contato@bibliainteligente.app"
                className="text-primary hover:underline"
                data-testid="link-email-terms"
              >
                contato@bibliainteligente.app
              </a>
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">13. Alterações destes Termos</h2>
          <p>
            Podemos atualizar estes Termos periodicamente para refletir mudanças no App ou
            na legislação. Alterações relevantes serão comunicadas pelo App ou por e-mail
            com antecedência razoável. O uso continuado após a vigência das mudanças
            implica aceitação tácita da nova versão.
          </p>
          <p className="text-muted-foreground italic pt-4">
            Ao continuar utilizando o Bíblia Inteligente IA, você confirma que leu,
            compreendeu e concorda com estes Termos de Uso.
          </p>
        </section>
      </article>
    </div>
  );
}
