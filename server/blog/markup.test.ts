import { describe, expect, it } from "vitest";
import { extractFaq, pageHtml, renderMarkdown } from "./markup";

describe("public blog HTML", () => {
  it("escapes article HTML and only links to allowed internal routes", () => {
    const result = renderMarkdown(
      '## Cabeçalho <img src=x onerror=alert(1)>\n\n<script>alert(1)</script> [estude](/baixar) [externo](javascript:alert(1))',
    );
    expect(result).toContain("&lt;script&gt;");
    expect(result).not.toContain("<script>alert");
    expect(result).not.toContain("href=\"javascript:");
    expect(result).toContain('href="/baixar"');
  });

  it("creates canonical, Open Graph and safely escaped structured data", () => {
    const result = pageHtml({
      title: 'Teste "bíblico"', description: "Descrição", path: "/blog/teste",
      body: "<main>Seguro</main>",
      structured: [{ "@context": "https://schema.org", headline: "</script><script>alert(1)</script>" }],
    });
    expect(result).toContain('rel="canonical"');
    expect(result).toContain("https://bibliainteligente.replit.app/blog/teste");
    expect(result).toContain('property="og:title"');
    expect(result).not.toContain("</script><script>alert");
  });

  it("extracts questions only from the FAQ section", () => {
    expect(extractFaq("## Contexto\n### Outro\nResposta.\n## Perguntas frequentes\n### O que é?\nUma explicação.\n## Conclusão"))
      .toEqual([{ question: "O que é?", answer: "Uma explicação." }]);
  });
});