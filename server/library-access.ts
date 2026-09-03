export type LibraryAccessState = "sample" | "owned" | "locked";

interface ResolveLibraryAccessInput {
  userId: string | null;
  userPlan: string | null;
  hasPurchased: boolean;
  chapterOrder?: number;
  chapterIsSample?: boolean;
  userRole?: string | null;
}

/**
 * Modelo único de acesso da Biblioteca:
 * - os dois primeiros capítulos e capítulos marcados como amostra são públicos;
 * - compras avulsas antigas continuam válidas;
 * - administradores, Premium e vitalício têm acesso completo;
 * - Gold não libera a Biblioteca.
 */
export function resolveLibraryAccess({
  userId,
  userPlan,
  hasPurchased,
  chapterOrder,
  chapterIsSample,
  userRole,
}: ResolveLibraryAccessInput): LibraryAccessState {
  if (
    (chapterOrder !== undefined && chapterOrder <= 2) ||
    chapterIsSample === true
  ) {
    return "sample";
  }

  if (hasPurchased) return "owned";
  if (!userId) return "locked";
  if (userRole === "admin" || userRole === "super_admin") return "owned";

  const planHierarchy: Record<string, number> = {
    gold: 1,
    gold_anual: 1,
    gold_annual: 1,
    premium: 2,
    premium_anual: 2,
    premium_annual: 2,
    vitalicio: 3,
    strong_lifetime: 3,
  };
  const actualLevel = userPlan ? (planHierarchy[userPlan] ?? 0) : 0;
  return actualLevel >= planHierarchy.premium ? "owned" : "locked";
}