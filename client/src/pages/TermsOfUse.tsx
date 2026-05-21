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
          <h2 className="text-lg font-semibold">1. Sobre o Aplicativo</h2>
          <p>
            O <strong>Bíblia Inteligente IA</strong> ("App") é uma plataforma digital
            voltada ao estudo bíblico, aprendizado teológico e apoio ao desenvolvimento
            espiritual, utilizando Inteligência Artificial e ferramentas avançadas de
            interpretação das Escrituras (Bíblia em múltiplos idiomas, Dicionário Strong,
            Professor IA, Exegese IA, gravação de sermões e demais recursos).
          </p>
          <p className="pt-2">
            <strong>Operadora:</strong>
            <br />
            E.L SERVIÇOS EMPRESARIAIS LTDA
            <br />
            CNPJ: [SEU CNPJ]
            <br />
            E-mail:{" "}
            <a
              href="mailto:suporte@bibliainteligenteia.com.br"
              className="text-primary hover:underline"
              data-testid="link-email-empresa"
            >
              suporte@bibliainteligenteia.com.br
            </a>
            <br />
            Site:{" "}
            <a
              href="https://bibliainteligente.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              data-testid="link-site-empresa"
            >
              https://bibliainteligente.com.br
            </a>
          </p>
          <p className="pt-2">
            Ao criar uma conta, instalar ou utilizar o App, você declara que leu,
            entendeu e concorda integralmente com estes Termos de Uso e com a nossa{" "}
            <a href="/privacidade" className="text-primary hover:underline">
              Política de Privacidade
            </a>
            . Se não concordar com qualquer disposição, não utilize o App.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">2. Cadastro e Conta</h2>
          <p>
            A leitura da Bíblia é gratuita e não exige cadastro. O Dicionário Strong, o
            Professor IA e recursos avançados exigem login, com nível de acesso variável
            conforme o plano contratado.
          </p>
          <p>Você é responsável por:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>manter a confidencialidade da sua senha;</li>
            <li>proteger o acesso à sua conta;</li>
            <li>todas as atividades realizadas através dela;</li>
            <li>fornecer informações verdadeiras e atualizadas.</li>
          </ul>
          <p>Notifique-nos imediatamente em caso de uso não autorizado da sua conta.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">3. Assinaturas e Pagamentos</h2>
          <p>
            O App possui funcionalidades gratuitas e <strong>planos pagos</strong> (Gold,
            Premium e Strong Vitalício) com recursos premium. Preços, recursos inclusos e
            periodicidade são exibidos na tela de assinatura antes da compra.
          </p>

          <h3 className="text-base font-semibold mt-3">3.1. Forma de pagamento por plataforma</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>iOS (iPhone/iPad):</strong> processado <strong>exclusivamente</strong>{" "}
              pela <strong>Apple In-App Purchase (StoreKit)</strong>. A cobrança é feita
              pela Apple, conforme as condições do App Store.
            </li>
            <li>
              <strong>Android:</strong> processado pelo <strong>Google Play Billing</strong>.
              A cobrança é feita pelo Google, conforme as condições do Google Play.
            </li>
            <li>
              <strong>Website (navegador):</strong> processado pelo{" "}
              <strong>Mercado Pago</strong> (cartão, Pix e demais meios disponíveis).
            </li>
          </ul>

          <h3 className="text-base font-semibold mt-3">3.2. Renovação automática</h3>
          <p>
            Assinaturas mensais e anuais são <strong>renovadas automaticamente</strong> ao
            final de cada ciclo, salvo cancelamento prévio. O valor da renovação é o
            vigente na data da cobrança, podendo ser atualizado mediante aviso prévio de
            pelo menos 30 dias.
          </p>

          <h3 className="text-base font-semibold mt-3">3.3. Como cancelar</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>iOS:</strong> Ajustes → seu nome → Assinaturas → Bíblia Inteligente
              IA → Cancelar.
            </li>
            <li>
              <strong>Android:</strong> Google Play → ícone de perfil → Pagamentos e
              assinaturas → Assinaturas → Bíblia Inteligente IA → Cancelar.
            </li>
            <li>
              <strong>Web (Mercado Pago):</strong> acesse a área de assinaturas da sua
              conta Mercado Pago ou solicite cancelamento pelos canais da seção 16.
            </li>
          </ul>
          <p className="text-muted-foreground italic">
            O cancelamento interrompe a próxima renovação. O acesso aos recursos pagos
            permanece ativo até o fim do período já pago.
          </p>

          <h3 className="text-base font-semibold mt-3">3.4. Teste gratuito (free trial)</h3>
          <p>
            Quando oferecido, o teste gratuito é destinado apenas a <strong>novos
            assinantes</strong> e tem duração informada na tela de oferta. Para evitar
            cobrança, cancele antes do término do período de teste pelos mesmos canais
            descritos em 3.3. O teste pode ser alterado ou removido a qualquer momento.
          </p>

          <h3 className="text-base font-semibold mt-3">3.5. Reembolso e arrependimento</h3>
          <p>
            Conforme o Código de Defesa do Consumidor (art. 49), você tem direito de
            arrependimento em até <strong>7 dias corridos</strong> contados da
            contratação. Solicitações seguem as políticas da plataforma utilizada:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Apple App Store — solicite diretamente à Apple via reportaproblem.apple.com</li>
            <li>Google Play — solicite via Google Play → Histórico de pedidos</li>
            <li>Mercado Pago — solicite pelos canais da seção 16</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">4. Uso Permitido</h2>
          <p>É <strong>proibido</strong>:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>utilizar o App para atividades ilegais, abusivas, difamatórias ou discriminatórias;</li>
            <li>tentar acessar áreas restritas sem autorização;</li>
            <li>realizar engenharia reversa, descompilar ou copiar o código do App;</li>
            <li>automatizar acessos indevidos (bots, scrapers);</li>
            <li>utilizar a IA para fins ilícitos ou para gerar conteúdo ofensivo;</li>
            <li>tentar contornar limites do sistema, autenticação ou pagamento;</li>
            <li>compartilhar sua conta com terceiros ou revender o acesso;</li>
            <li>sobrecarregar a infraestrutura por requisições excessivas.</li>
          </ul>
          <p>
            O descumprimento poderá resultar em suspensão imediata ou exclusão da conta,
            sem direito a reembolso, e adoção das medidas legais cabíveis.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">5. Inteligência Artificial</h2>
          <p>
            Os módulos <strong>Professor IA</strong>, <strong>Exegese IA</strong> e demais
            funcionalidades inteligentes utilizam modelos de Inteligência Artificial
            (OpenAI) para auxiliar no estudo bíblico.
          </p>
          <p>As respostas geradas:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>podem conter imprecisões, omissões ou erros factuais;</li>
            <li>representam apoio educacional e devocional;</li>
            <li>refletem padrões probabilísticos e não são opinião teológica oficial;</li>
            <li>
              <strong>NÃO substituem</strong> orientação pastoral, aconselhamento
              espiritual, parecer teológico ou consulta profissional (jurídica, médica,
              psicológica) qualificada.
            </li>
          </ul>
          <p>
            Você reconhece que utiliza as respostas da IA por sua própria conta e risco.
            Recomendamos verificar fontes adicionais e consultar líderes religiosos de
            sua confiança para decisões importantes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">6. Conteúdo do Usuário</h2>
          <p>
            Anotações, marcações, gravações de áudio e demais conteúdos criados por você
            no App pertencem a <strong>você</strong>. Ao compartilhar esse conteúdo por
            meio do App (por exemplo, compartilhamento de áudios), você concede ao Bíblia
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
            Todo o conteúdo do App, incluindo marca, logotipo, interface, design, código,
            inteligência artificial e funcionalidades exclusivas, pertence aos respectivos
            titulares e é protegido pela legislação aplicável.
          </p>
          <p>
            As <strong>versões bíblicas</strong> respeitam suas respectivas licenças e
            direitos autorais (domínio público, licenças abertas ou autorização dos
            detentores). O <strong>Dicionário Strong</strong> em português usa traduções e
            referências licenciadas. Não é permitido extrair, redistribuir ou
            comercializar esses conteúdos sem autorização.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">8. Privacidade e Dados</h2>
          <p>
            O Bíblia Inteligente IA poderá coletar informações necessárias ao
            funcionamento da plataforma, incluindo:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>nome;</li>
            <li>e-mail;</li>
            <li>dados técnicos do dispositivo;</li>
            <li>informações de uso;</li>
            <li>preferências do usuário;</li>
            <li>conteúdo enviado à IA;</li>
            <li>informações de pagamento processadas pelas plataformas oficiais (Apple, Google, Mercado Pago).</li>
          </ul>
          <p>
            O tratamento de dados ocorre conforme a <strong>Lei Geral de Proteção de
            Dados (LGPD – Lei nº 13.709/2018)</strong>. Para mais informações, consulte
            nossa{" "}
            <a href="/privacidade" className="text-primary hover:underline">
              Política de Privacidade
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">9. Dados de Localização</h2>
          <p>
            O App poderá utilizar permissões de localização <strong>apenas quando
            necessário</strong> para funcionalidades específicas e sempre mediante
            autorização expressa do usuário. O Bíblia Inteligente IA <strong>não
            comercializa</strong> dados de localização e segue as melhores práticas de
            minimização do uso desse tipo de dado.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">10. Idade Mínima</h2>
          <p>
            O App é destinado a usuários com idade igual ou superior a{" "}
            <strong>13 anos</strong>. Menores de 18 anos deverão utilizar o aplicativo
            sob supervisão e com consentimento dos responsáveis legais.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">11. Disponibilidade e Modificações</h2>
          <p>
            Buscamos manter o App disponível 24 horas por dia, mas não garantimos
            funcionamento ininterrupto. Manutenções programadas, atualizações ou falhas
            técnicas (próprias ou de terceiros como Apple, Google, Mercado Pago, OpenAI,
            provedores de nuvem) podem causar indisponibilidade temporária.
          </p>
          <p>
            Reservamo-nos o direito de modificar, suspender ou descontinuar recursos do
            App a qualquer momento, com aviso prévio sempre que possível.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">12. Exclusão de Conta</h2>
          <p>
            O usuário pode solicitar a exclusão da conta diretamente pelo App em{" "}
            <em>Configurações → Apagar Conta</em>. A exclusão é definitiva e remove dados
            pessoais conforme descrito na Política de Privacidade, exceto quando houver
            obrigação legal de retenção.
          </p>
          <p>
            <strong>Atenção:</strong> assinaturas ativas devem ser canceladas separadamente
            nas Lojas (ver seção 3.3) — apagar a conta <strong>não cancela</strong>{" "}
            automaticamente a cobrança da Apple ou Google.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">13. Limitação de Responsabilidade</h2>
          <p>
            O App é fornecido "como está", sem garantia de disponibilidade contínua ou
            ausência total de erros. Na máxima extensão permitida pela legislação
            aplicável, o Bíblia Inteligente IA <strong>não se responsabiliza</strong> por:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>decisões pessoais, religiosas, profissionais ou financeiras tomadas com base no conteúdo do App ou em respostas da IA;</li>
            <li>perdas indiretas, lucros cessantes, danos morais ou consequenciais;</li>
            <li>indisponibilidade causada por serviços de terceiros (Apple, Google, OpenAI, Mercado Pago, provedores de internet etc.);</li>
            <li>perda de dados decorrente de falha do dispositivo do usuário ou exclusão de conta;</li>
            <li>respostas imperfeitas da IA ou incompatibilidade com dispositivos específicos.</li>
          </ul>
          <p>
            Nossa responsabilidade máxima por qualquer disputa relacionada ao App está
            limitada ao valor efetivamente pago pelo usuário nos últimos <strong>12
            meses</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">14. Encerramento</h2>
          <p>
            Poderemos suspender ou encerrar contas que violem estes Termos ou utilizem o
            App de forma abusiva, sem aviso prévio em casos graves, e sem direito a
            reembolso.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">15. Lei Aplicável e Foro</h2>
          <p>
            Estes Termos são regidos pelas leis da{" "}
            <strong>República Federativa do Brasil</strong>, em especial o Código de
            Defesa do Consumidor (Lei 8.078/1990), o Marco Civil da Internet (Lei
            12.965/2014) e a Lei Geral de Proteção de Dados (Lei 13.709/2018). Fica eleito
            o foro do <strong>domicílio do consumidor</strong> para dirimir quaisquer
            controvérsias.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">16. Alterações dos Termos</h2>
          <p>
            Estes Termos poderão ser atualizados periodicamente para refletir mudanças no
            App ou na legislação. Mudanças relevantes serão comunicadas dentro do
            aplicativo ou por e-mail com antecedência razoável. O uso continuado após a
            vigência das alterações implica aceitação tácita da nova versão.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">17. Contato</h2>
          <p>Suporte oficial:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              E-mail:{" "}
              <a
                href="mailto:suporte@bibliainteligenteia.com.br"
                className="text-primary hover:underline"
                data-testid="link-email-suporte"
              >
                suporte@bibliainteligenteia.com.br
              </a>
            </li>
            <li>
              Instagram:{" "}
              <a
                href="https://instagram.com/bibliainteligenteia"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                data-testid="link-instagram"
              >
                @bibliainteligenteia
              </a>
            </li>
            <li>
              Site:{" "}
              <a
                href="https://bibliainteligente.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                data-testid="link-site"
              >
                https://bibliainteligente.com.br
              </a>
            </li>
          </ul>
          <p className="text-muted-foreground italic pt-4">
            Ao continuar utilizando o Bíblia Inteligente IA, você confirma que leu,
            compreendeu e concorda com estes Termos de Uso.
          </p>
        </section>
      </article>
    </div>
  );
}
