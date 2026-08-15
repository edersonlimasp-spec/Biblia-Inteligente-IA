import { useEffect, useState } from "react";

// ── Cores por categoria (usadas no marcador de capa) ─────────────────────
const CATEGORY_COLORS: Record<string, { from: string; to: string; text: string }> = {
  "Devocionais":               { from: "#4A5D43", to: "#33402E", text: "#D8E2CF" },
  "Vida Cristã":               { from: "#3E5C6B", to: "#2A3F4A", text: "#CFE0E8" },
  "Ministério":                { from: "#6B4A3E", to: "#4A332B", text: "#E8D6CF" },
  "Estudo Bíblico e Teologia": { from: "#43405D", to: "#2E2C40", text: "#D3D0E5" },
  "Família":                   { from: "#6B5A3E", to: "#4A3E2B", text: "#E8DFC9" },
  "Clássicos":                 { from: "#5C4632", to: "#3F2F21", text: "#E4D3B8" },
};
const DEFAULT_COLORS = { from: "#5C4632", to: "#3F2F21", text: "#E4D3B8" };

interface BookCoverProps {
  coverUrl: string | null;
  title: string;
  category: string;
  /** Tamanho do título no marcador: sm (miniatura), md (estante), lg (tela do livro) */
  size?: "sm" | "md" | "lg";
}

/**
 * Capa de livro da Biblioteca.
 * - Exibe a imagem (PNG, JPG ou SVG) quando coverUrl existe e carrega.
 * - Sem capa (ou com erro de carregamento), exibe um marcador neutro:
 *   título em tipografia serifada sobre a cor da categoria.
 */
export function BookCover({ coverUrl, title, category, size = "md" }: BookCoverProps) {
  const [failed, setFailed] = useState(false);
  // Nova URL de capa → tentar carregar de novo
  useEffect(() => { setFailed(false); }, [coverUrl]);
  const colors = CATEGORY_COLORS[category] ?? DEFAULT_COLORS;

  if (coverUrl && !failed) {
    return (
      <img
        src={coverUrl}
        alt={title}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  const fontSize = size === "sm" ? "0.5rem" : size === "lg" ? "0.95rem" : "0.7rem";
  const pad = size === "sm" ? "0.3rem" : "0.6rem";

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center text-center"
      style={{
        background: `linear-gradient(158deg, ${colors.from}, ${colors.to})`,
        padding: pad,
      }}
      aria-label={title}
    >
      <span
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize,
          lineHeight: 1.3,
          color: colors.text,
          fontWeight: 600,
          display: "-webkit-box",
          WebkitLineClamp: size === "sm" ? 3 : 5,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {title}
      </span>
      {size !== "sm" && (
        <span
          aria-hidden="true"
          style={{
            marginTop: "0.5em",
            width: "1.6em",
            height: 1,
            background: colors.text,
            opacity: 0.4,
          }}
        />
      )}
    </div>
  );
}
