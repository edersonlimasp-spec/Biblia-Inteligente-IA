import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Highlighter,
  Languages,
  Library,
  MessageCircleQuestion,
  Mic,
  NotebookPen,
  ScrollText,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { detectDownloadDevice, STORE_LINKS, trackStoreDownload, withAttribution } from "@/lib/google-ads";
import "./OfferPage.css";

type Store = "ios" | "android";
type Plan = { id: string; name: string; price: number; period: "monthly" | "yearly" | "lifetime" };
type PlanResponse = { plans: Plan[] };

const storeDetails: Record<Store, { label: string; subtitle: string }> = {
  ios: { label: "App Store", subtitle: "Baixar para iPhone e iPad" },
  android: { label: "Google Play", subtitle: "Baixar para Android" },
};

const features = [
  { icon: MessageCircleQuestion, title: "Assistente de estudo: apoio de IA", text: "Consulte contexto histórico, cultural e costumes da época como apoio à sua leitura. Use as sugestões para aprofundar a pesquisa e preparar estudos e pregações, sempre conferindo as referências nas Escrituras." },
  { icon: Languages, title: "Dicionário hebraico e grego (Strong)", text: "Consulte o significado das palavras no original com o dicionário Strong e aprofunde seu estudo, considerando o contexto da passagem." },
  { icon: Mic, title: "Gravação e resumo de sermões", text: "Grave sua ministração e reúna transcrição em português, resumo com apoio de IA e PDF. Revise o material antes de guardar ou compartilhar." },
  { icon: ScrollText, title: "Planos de leitura", text: "Cultive a leitura das Escrituras com um plano e acompanhe seu progresso, no seu ritmo." },
  { icon: Library, title: "Biblioteca cristã", text: "Amplie suas consultas com livros cristãos e leia amostras. O catálogo completo está disponível no Premium." },
  { icon: BookOpen, title: "Cursos e estudos bíblicos", text: "Reúna temas e organize seus estudos para aprofundar o conhecimento bíblico e apoiar a preparação de encontros." },
  { icon: CalendarDays, title: "Agenda e listas de oração", text: "Organize seus compromissos e pedidos de oração para acompanhar sua caminhada de fé." },
  { icon: Highlighter, title: "Anotações e destaques", text: "Destaque versículos, registre suas observações e retome suas anotações ao aprofundar o estudo." },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);
}

function StoreMark({ store }: { store: Store }) {
  return store === "ios" ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="offer-store-mark"><path fill="currentColor" d="M16.7 12.8c0-2.1 1.7-3.1 1.8-3.2-1-.1-2.2-1.1-3.3-1.1-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.7.8-3.4 2.1-1.5 2.6-.4 6.4 1.1 8.5.7 1 1.5 2.2 2.7 2.1 1.1 0 1.6-.7 2.9-.7s1.7.7 2.9.7c1.2 0 2-.9 2.7-2 .8-1.1 1.1-2.2 1.2-2.3-.1 0-2.5-1-2.5-4.1Zm-2.2-5.7c.6-.8 1-1.8.9-2.8-.9 0-2 .6-2.6 1.3-.6.7-1.1 1.7-1 2.7 1 .1 2-.5 2.7-1.2Z" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="offer-store-mark"><path fill="#34A853" d="m2.4 3.2 11.2 8.8L2.4 20.8c-.3-.4-.4-.9-.4-1.5V4.7c0-.6.1-1.1.4-1.5Z" /><path fill="#FBBC04" d="m15 12 3.1-2.4 3.7 2.1c1 .6 1 1.9 0 2.5l-3.7 2.1L15 12Z" /><path fill="#EA4335" d="m2.4 3.2 13.8 7.9L13.6 12 2.4 3.2Z" /><path fill="#4285F4" d="m2.4 20.8 13.8-7.9-2.6-1.9-11.2 9.8Z" /></svg>
  );
}

export function OfferPage() {
  const heroRef = useRef<HTMLElement>(null);
  const choicesRef = useRef<HTMLElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [priceError, setPriceError] = useState(false);
  const device = detectDownloadDevice();
  const preferredStore: Store = device === "ios" ? "ios" : "android";

  const getPlans = () => {
    setPriceError(false);
    setPlans(null);
    fetch("/api/public/plans", { credentials: "include" })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load plans");
        return response.json() as Promise<PlanResponse>;
      })
      .then((data) => setPlans(data.plans))
      .catch(() => setPriceError(true));
  };

  useEffect(() => {
    getPlans();
    const previousTitle = document.title;
    document.title = "Bíblia Inteligente IA — Aprofunde seu estudo da Bíblia";
    const hero = heroRef.current;
    if (!hero || !("IntersectionObserver" in window)) return () => { document.title = previousTitle; };
    const observer = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0), { threshold: 0.08 });
    observer.observe(hero);
    return () => { observer.disconnect(); document.title = previousTitle; };
  }, []);

  const openDownload = () => {
    if (device === "desktop") {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      choicesRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    }
  };
  const priceLabel = (plan: Plan) => plan.period === "yearly" ? "/ ano" : plan.period === "monthly" ? "/ mês" : "pagamento único";

  return (
    <main className="offer-page">
      <section className="offer-hero" ref={heroRef} aria-labelledby="offer-title">
        <div className="offer-shell">
          <nav className="offer-nav" aria-label="Navegação da página">
            <a className="offer-brand" href={withAttribution("/")}><img src="/biblia-store-icon-512.png" alt="" /><span>Bíblia Inteligente IA</span></a>
            <a className="offer-nav-link" href="#recursos">Conheça o app <ArrowDown size={15} /></a>
          </nav>
          <div className="offer-hero-grid">
            <div className="offer-hero-copy">
              <p className="offer-eyebrow"><span /> Ferramentas de apoio ao estudo bíblico</p>
              <h1 id="offer-title">Aprofunde seu estudo da Bíblia.</h1>
              <p className="offer-intro">Contexto histórico e cultural, dicionário hebraico e grego e um assistente de IA para apoiar sua leitura — sem substituir a Palavra.</p>
              <div className="offer-actions">
                {device === "desktop" ? <button className="offer-primary" type="button" onClick={openDownload}>Baixar grátis <ArrowRight size={18} /></button> : <a className="offer-primary" href={STORE_LINKS[preferredStore]} target="_blank" rel="noopener noreferrer" onClick={trackStoreDownload}>Baixar grátis <ArrowRight size={18} /></a>}
                <a className="offer-web-link" href={withAttribution("/")}>Usar no navegador</a>
              </div>
              <p className="offer-free-note"><Check size={16} /> É gratuito para começar</p>
              <div className="offer-hero-badges" aria-label="Baixe nas lojas">
                {(["ios", "android"] as Store[]).map((store) => <a key={store} href={STORE_LINKS[store]} target="_blank" rel="noopener noreferrer" onClick={trackStoreDownload}><StoreMark store={store} /><span><small>Disponível na</small><b>{storeDetails[store].label}</b></span></a>)}
              </div>
            </div>
            <div className="offer-hero-art" aria-label="Uma leitura bíblica acompanhada por recursos de estudo">
              <div className="offer-orbit offer-orbit-one" /><div className="offer-orbit offer-orbit-two" />
              <div className="offer-phone">
                <div className="offer-phone-top"><span>9:41</span><span>Leitura</span><span>•••</span></div>
                <p className="offer-phone-book">João 15</p>
                <p className="offer-phone-verse">“Eu sou a videira; vós, os ramos. Quem permanece em mim, e eu, nele, esse dá muito fruto.”</p>
                <p className="offer-phone-ref">João 15:5</p>
                <div className="offer-phone-answer"><Sparkles size={15} /><span>Consulte o assistente de estudo</span><ArrowRight size={14} /></div>
              </div>
              <div className="offer-art-card offer-art-card-a"><Languages size={18} /><span>Dicionário Strong</span></div>
              <div className="offer-art-card offer-art-card-b"><Highlighter size={18} /><span>Suas anotações</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="offer-trust"><div className="offer-shell"><p>A Bíblia inteira ao seu alcance</p><span>66 livros</span><i /><span>leitura gratuita</span><i /><span>estudo que acompanha você</span></div></section>

      <section className="offer-section offer-welcome" id="recursos">
        <div className="offer-shell offer-section-heading">
          <p className="offer-kicker">Sua leitura no centro do estudo</p>
          <h2>Mais contexto para aprofundar sua leitura.</h2>
          <p>A IA não substitui sua leitura nem sua igreja: ela ajuda você a ir mais fundo nas Escrituras. É uma ferramenta de apoio, não uma autoridade espiritual, e não substitui a direção do Espírito Santo ou o acompanhamento do seu pastor.</p>
        </div>
        <div className="offer-shell offer-feature-grid">
          {features.map(({ icon: Icon, title, text }, index) => <article className={`offer-feature feature-${index + 1}`} key={title}><div className="offer-feature-icon"><Icon size={22} /></div><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>

      <section className="offer-section offer-study-band">
        <div className="offer-shell offer-study-layout">
          <div><p className="offer-kicker">Apoio para preparar seus encontros</p><h2>Aprofunde a pesquisa. Prepare com cuidado.</h2><p>Reúna referências, contexto histórico e cultural e suas anotações para um estudo, uma célula ou uma pregação. O assistente de estudo auxilia na organização; a leitura, a conferência das fontes e o discernimento continuam com você.</p></div>
          <div className="offer-path" aria-label="Caminho para preparar um estudo"><div><BookOpen /><span>Leia a passagem</span></div><ArrowRight /><div><NotebookPen /><span>Faça suas notas</span></div><ArrowRight /><div><UsersRound /><span>Compartilhe com cuidado</span></div></div>
        </div>
      </section>

      <section className="offer-section offer-steps">
        <div className="offer-shell"><div className="offer-section-heading"><p className="offer-kicker">Comece em poucos minutos</p><h2>Seu próximo estudo começa com a Palavra.</h2></div><ol className="offer-step-list"><li><span>01</span><div><h3>Baixe o aplicativo</h3><p>Escolha a loja do seu aparelho e instale gratuitamente.</p></div></li><li><span>02</span><div><h3>Crie sua conta</h3><p>Ela mantém sua leitura, notas e progresso sincronizados.</p></div></li><li><span>03</span><div><h3>Leia e aprofunde seu estudo</h3><p>Leia a passagem, faça anotações e consulte as ferramentas de apoio quando precisar.</p></div></li></ol></div>
      </section>

      <section className="offer-section offer-pricing" aria-labelledby="prices-title">
        <div className="offer-shell"><div className="offer-pricing-header"><div><p className="offer-kicker">Escolhas claras</p><h2 id="prices-title">Leitura gratuita. Apoio para aprofundar.</h2><p>A leitura das Escrituras é gratuita. A conta permite sincronizar seus dados; os planos pagos oferecem ferramentas adicionais de consulta, organização e apoio de IA, conforme o plano.</p></div></div>
          {!plans && !priceError && <div className="offer-price-loading" aria-live="polite"><span /><span /><span /></div>}
          {priceError && <div className="offer-price-error" role="alert"><p>Não foi possível carregar os valores agora.</p><button type="button" onClick={getPlans}>Tentar novamente</button></div>}
          {plans && <><div className="offer-plan-grid">{plans.map((plan) => <article className={`offer-plan ${plan.period === "lifetime" ? "is-lifetime" : ""}`} key={plan.id}><p>{plan.name}</p><strong>{formatPrice(plan.price)}</strong><small>{priceLabel(plan)}</small>{plan.period === "lifetime" && <span className="offer-plan-note">Vitalício para o Strong; não inclui Premium, Biblioteca ou todo o app.</span>}</article>)}</div><p className="offer-price-disclaimer">Valores para compra na web em reais (BRL). Nas lojas, confirme o preço final antes de concluir. A disponibilidade dos recursos varia conforme o plano.</p></>}
        </div>
      </section>

      <section className="offer-section offer-download" ref={choicesRef} aria-labelledby="download-title"><div className="offer-shell"><p className="offer-kicker">Leve seu estudo com você</p><h2 id="download-title">Baixe onde você lê.</h2><p>Disponível para iPhone, iPad e Android. Escolha sua loja.</p><div className="offer-store-list">{(["ios", "android"] as Store[]).map((store) => <a key={store} className="offer-store-button" href={STORE_LINKS[store]} target="_blank" rel="noopener noreferrer" onClick={trackStoreDownload}><StoreMark store={store} /><span><b>{storeDetails[store].label}</b><small>{storeDetails[store].subtitle}</small></span><ArrowRight size={18} /></a>)}</div></div></section>

      <section className="offer-section offer-faq" aria-labelledby="faq-title"><div className="offer-shell"><div className="offer-section-heading"><p className="offer-kicker">Dúvidas comuns</p><h2 id="faq-title">Antes de começar</h2></div><div className="offer-faq-list">
        <details><summary>O aplicativo é gratuito? <ChevronDown /></summary><p>Sim. A leitura da Bíblia é gratuita. Criar uma conta ajuda a sincronizar seu progresso, notas e outros dados. Algumas ferramentas de consulta e apoio de IA dependem do plano.</p></details>
        <details><summary>A IA vai interpretar a Bíblia por mim? <ChevronDown /></summary><p>Não. O assistente é uma ferramenta de apoio e consulta para aprofundar o estudo de contextos históricos, culturais e costumes da época, além de auxiliar na preparação de estudos e pregações. As respostas podem conter erros: confira as referências e leia a passagem em seu contexto. A IA não substitui a Palavra, sua leitura, a direção do Espírito Santo, sua igreja ou seu pastor.</p></details>
        <details><summary>Posso consultar mapas bíblicos? <ChevronDown /></summary><p>O app permite solicitar imagens de mapas com IA no recurso de geração de imagens, disponível no Premium. São ilustrações geradas, não um atlas bíblico com mapas verificados, e podem conter imprecisões históricas e geográficas. Confira os locais em fontes confiáveis.</p></details>
        <details><summary>Funciona no iPhone e no Android? <ChevronDown /></summary><p>Sim. Você pode baixar na App Store para iPhone e iPad ou no Google Play para Android.</p></details>
        <details><summary>Preciso criar uma conta? <ChevronDown /></summary><p>Você pode começar a explorar, mas a conta é necessária para manter seus dados sincronizados e acessar recursos que dependem dela.</p></details>
        <details><summary>Como cancelo uma assinatura? <ChevronDown /></summary><p>Assinaturas feitas pela App Store ou Google Play devem ser canceladas nas configurações da respectiva loja. Uma compra pela web concede o período contratado e não tem renovação automática.</p></details>
      </div></div></section>

      <section className="offer-final"><div className="offer-shell"><div><p className="offer-kicker">Um lugar para voltar todos os dias</p><h2>Abra a Palavra.<br />Permaneça nela.</h2><p>Baixe gratuitamente e comece o seu próximo estudo.</p></div>{device === "desktop" ? <button type="button" className="offer-primary" onClick={openDownload}>Baixar grátis <ArrowRight size={18} /></button> : <a className="offer-primary" href={STORE_LINKS[preferredStore]} target="_blank" rel="noopener noreferrer" onClick={trackStoreDownload}>Baixar grátis <ArrowRight size={18} /></a>}</div></section>
      <footer className="offer-footer"><div className="offer-shell"><a className="offer-brand" href={withAttribution("/")}><img src="/biblia-store-icon-512.png" alt="" /><span>Bíblia Inteligente IA</span></a><p>Estudo bíblico com profundidade e cuidado.</p></div></footer>
      <div className={`offer-sticky-download ${showSticky ? "is-visible" : ""}`} aria-hidden={!showSticky}>{device === "desktop" ? <button type="button" tabIndex={showSticky ? 0 : -1} onClick={openDownload}>Escolher onde baixar <ArrowRight size={17} /></button> : <a href={STORE_LINKS[preferredStore]} target="_blank" rel="noopener noreferrer" tabIndex={showSticky ? 0 : -1} onClick={trackStoreDownload}>Baixar grátis <ArrowRight size={17} /></a>}</div>
    </main>
  );
}