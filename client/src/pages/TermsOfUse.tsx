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

      <article className="max-w-3xl mx-auto p-4 md:p-8 space-y-4 text-sm leading-relaxed">
        <p className="text-muted-foreground">Última atualização: Janeiro de 2026</p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">1. Aceitação</h2>
          <p>
            Ao usar o aplicativo <strong>Bíblia Inteligente IA</strong> você concorda com
            estes Termos. Se não concordar, não use o app.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">2. Conta</h2>
          <p>
            Você é responsável pela segurança da sua conta. Mantenha sua senha em sigilo.
            Avise-nos imediatamente em caso de uso não autorizado.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">3. Assinaturas</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>iOS:</strong> assinaturas são processadas pela Apple (App Store). Renovação
              automática conforme o plano. Cancele em <em>Ajustes &gt; Apple ID &gt; Assinaturas</em>.
            </li>
            <li>
              <strong>Android:</strong> processadas pelo Google Play. Cancele em
              <em> Play Store &gt; Pagamentos e assinaturas</em>.
            </li>
            <li>
              <strong>Web:</strong> processadas pelo Mercado Pago.
            </li>
            <li>
              O período de teste gratuito de 7 dias é oferecido apenas a novos usuários.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">4. Uso aceitável</h2>
          <p>
            É proibido usar o app para fins ilegais, fazer engenharia reversa ou tentar
            burlar limites de uso da IA.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">5. Conteúdo da IA</h2>
          <p>
            O Professor IA é uma ferramenta de estudo. As respostas podem conter
            imprecisões e <strong>não substituem orientação pastoral, teológica ou
            profissional</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">6. Propriedade intelectual</h2>
          <p>
            O nome, logotipo e código do app pertencem aos seus respectivos titulares.
            Os textos bíblicos respeitam as licenças de cada versão.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">7. Encerramento</h2>
          <p>
            Você pode apagar sua conta a qualquer momento em
            <em> Configurações &gt; Apagar conta</em>. Podemos suspender contas que violarem
            estes Termos.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">8. Alterações</h2>
          <p>Podemos atualizar estes Termos. Mudanças relevantes serão informadas no app.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">9. Contato</h2>
          <p>
            <a
              href="https://instagram.com/bibliainteligenteia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              data-testid="link-contact-terms"
            >
              @bibliainteligenteia
            </a>
          </p>
        </section>
      </article>
    </div>
  );
}
