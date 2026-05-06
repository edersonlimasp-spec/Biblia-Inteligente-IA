import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PrivacyPolicyProps {
  onBack?: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (onBack ? onBack() : window.history.back())}
            data-testid="button-back-privacy"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Política de Privacidade</h1>
            <p className="text-sm text-muted-foreground">Bíblia Inteligente IA</p>
          </div>
        </div>
      </header>

      <article className="max-w-3xl mx-auto p-4 md:p-8 space-y-4 text-sm leading-relaxed">
        <p className="text-muted-foreground">Última atualização: Janeiro de 2026</p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">1. Quem somos</h2>
          <p>
            O aplicativo <strong>Bíblia Inteligente IA</strong> é mantido pela equipe Bíblia
            Inteligente. Esta política descreve como coletamos, usamos e protegemos suas
            informações ao usar o aplicativo (web, Android e iOS).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">2. Dados que coletamos</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Conta:</strong> nome, e-mail e (quando aplicável) ID do provedor (Google ou Apple).</li>
            <li><strong>Uso do app:</strong> versículos lidos, marcações, anotações e histórico do Professor IA.</li>
            <li><strong>Assinatura:</strong> status do plano e identificadores de transação (Apple, Google ou Mercado Pago).</li>
            <li><strong>Diagnóstico:</strong> logs de erro e identificador de dispositivo para suporte.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">3. Como usamos seus dados</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Autenticar você e manter sua sessão.</li>
            <li>Sincronizar marcações, anotações e progresso entre dispositivos.</li>
            <li>Liberar recursos pagos conforme sua assinatura.</li>
            <li>Melhorar a experiência do usuário e corrigir falhas.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">4. Compartilhamento</h2>
          <p>
            Não vendemos seus dados. Compartilhamos somente com prestadores essenciais:
            OpenAI (Professor IA), provedores de pagamento (Apple, Google, Mercado Pago),
            envio de e-mail (Resend) e hospedagem do banco de dados.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">5. Seus direitos</h2>
          <p>
            Você pode acessar, corrigir e <strong>apagar sua conta a qualquer momento</strong>{" "}
            em <em>Configurações &gt; Apagar conta</em>. A exclusão remove permanentemente
            seu perfil, marcações, anotações e histórico do Professor IA.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">6. Segurança</h2>
          <p>
            Senhas são armazenadas com hash (bcrypt). A comunicação com nossos servidores
            usa HTTPS. Tokens de autenticação ficam armazenados no dispositivo.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">7. Crianças</h2>
          <p>O app não é direcionado a menores de 13 anos.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">8. Contato</h2>
          <p>
            Dúvidas sobre privacidade:{" "}
            <a
              href="https://instagram.com/bibliainteligenteia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              data-testid="link-contact-privacy"
            >
              @bibliainteligenteia
            </a>
            .
          </p>
        </section>
      </article>
    </div>
  );
}
