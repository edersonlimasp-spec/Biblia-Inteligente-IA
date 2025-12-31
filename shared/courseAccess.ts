export type UserPlan = 'free' | 'gold' | 'premium';
export type CourseLevel = 'iniciante' | 'moderado' | 'avancado';

export interface CanOpenLessonParams {
  isLoggedIn: boolean;
  plan: UserPlan;
  courseLevel: CourseLevel;
  moduleIndex: number;
  lessonIndex: number;
  isAdmin?: boolean;
  trackRequiredPlan?: 'gold' | 'premium';
}

export interface AccessResult {
  allowed: boolean;
  reason: 'NOT_AUTHENTICATED' | 'UPGRADE_REQUIRED' | 'ALLOWED';
  requiredPlan?: 'gold' | 'premium';
  message?: string;
}

/**
 * REGRAS OFICIAIS DE ACESSO:
 * 
 * IMPORTANTE: lessonIndex é a posição da lição DENTRO DO TRACK (1-based)
 *             moduleIndex é a posição do módulo DENTRO DO NÍVEL (1-based)
 * 
 * Estrutura: Cada módulo tem 1 track com 10 lições
 * 
 * Para calcular a posição GLOBAL da lição no nível:
 *   globalLessonIndex = (moduleIndex - 1) * 10 + lessonIndex
 * 
 * 1. NÃO LOGADO: ❌ Não abre nenhuma aula (só vê títulos)
 * 
 * 2. LOGADO SEM ASSINATURA (free):
 *    ✅ Apenas 3 primeiras aulas do INICIANTE (módulo 1, aulas 1-3)
 *    ❌ Nenhuma aula de intermediário ou avançado
 * 
 * 3. GOLD:
 *    ✅ Todas as aulas do INICIANTE
 *    ✅ Até 7ª aula do INTERMEDIÁRIO (módulo 1, aulas 1-7)
 *    ❌ 8ª aula+ do intermediário → bloqueado
 *    ❌ Todo AVANÇADO bloqueado
 * 
 * 4. PREMIUM: ✅ Acesso total
 */
export function canOpenLesson(params: CanOpenLessonParams): AccessResult {
  const { isLoggedIn, plan, courseLevel, moduleIndex, lessonIndex, isAdmin = false } = params;
  
  // Admin sempre tem acesso total
  if (isAdmin) {
    return { allowed: true, reason: 'ALLOWED' };
  }
  
  // REGRA 1: Usuário NÃO LOGADO não pode abrir NENHUMA aula
  if (!isLoggedIn) {
    return { 
      allowed: false, 
      reason: 'NOT_AUTHENTICATED',
      message: 'Entre ou crie uma conta para acessar as aulas'
    };
  }
  
  // REGRA 4: PREMIUM tem acesso total
  if (plan === 'premium') {
    return { allowed: true, reason: 'ALLOWED' };
  }
  
  // Calcular posição global da lição no nível (assumindo 10 lições por módulo)
  const globalLessonIndex = (moduleIndex - 1) * 10 + lessonIndex;
  
  // REGRA 3: GOLD
  if (plan === 'gold') {
    // ✅ Todas as aulas do INICIANTE
    if (courseLevel === 'iniciante') {
      return { allowed: true, reason: 'ALLOWED' };
    }
    
    // ✅ Até 7ª aula GLOBAL do INTERMEDIÁRIO
    if (courseLevel === 'moderado') {
      if (globalLessonIndex <= 7) {
        return { allowed: true, reason: 'ALLOWED' };
      }
      // ❌ 8ª aula+ do intermediário (global)
      return {
        allowed: false,
        reason: 'UPGRADE_REQUIRED',
        requiredPlan: 'premium',
        message: 'Assine Premium para acessar o conteúdo completo do Intermediário'
      };
    }
    
    // ❌ Todo AVANÇADO bloqueado para Gold
    if (courseLevel === 'avancado') {
      return {
        allowed: false,
        reason: 'UPGRADE_REQUIRED',
        requiredPlan: 'premium',
        message: 'Assine Premium para acessar o nível Avançado'
      };
    }
  }
  
  // REGRA 2: LOGADO SEM ASSINATURA (free)
  if (plan === 'free') {
    // ✅ Apenas 3 primeiras aulas GLOBAIS do INICIANTE
    if (courseLevel === 'iniciante' && globalLessonIndex <= 3) {
      return { allowed: true, reason: 'ALLOWED' };
    }
    
    // ❌ Demais aulas do iniciante
    if (courseLevel === 'iniciante') {
      return {
        allowed: false,
        reason: 'UPGRADE_REQUIRED',
        requiredPlan: 'gold',
        message: 'Assine Gold para acessar todas as aulas do Iniciante'
      };
    }
    
    // ❌ Nenhuma aula de intermediário
    if (courseLevel === 'moderado') {
      return {
        allowed: false,
        reason: 'UPGRADE_REQUIRED',
        requiredPlan: 'gold',
        message: 'Assine Gold para acessar o nível Intermediário'
      };
    }
    
    // ❌ Nenhuma aula de avançado
    if (courseLevel === 'avancado') {
      return {
        allowed: false,
        reason: 'UPGRADE_REQUIRED',
        requiredPlan: 'premium',
        message: 'Assine Premium para acessar o nível Avançado'
      };
    }
  }
  
  // Fallback: bloqueia por segurança
  return {
    allowed: false,
    reason: 'UPGRADE_REQUIRED',
    requiredPlan: 'gold',
    message: 'Assine para acessar este conteúdo'
  };
}

/**
 * Retorna informação sobre quais planos têm acesso a uma lição específica
 */
export function getLessonAccessInfo(params: Omit<CanOpenLessonParams, 'isLoggedIn' | 'plan'> & { isLoggedIn?: boolean; plan?: UserPlan }): {
  freeAccess: boolean;
  goldAccess: boolean;
  premiumAccess: boolean;
} {
  const { courseLevel, moduleIndex, lessonIndex, isAdmin = false } = params;
  
  if (isAdmin) {
    return { freeAccess: true, goldAccess: true, premiumAccess: true };
  }
  
  // Posição global (10 lições por módulo)
  const globalLessonIndex = (moduleIndex - 1) * 10 + lessonIndex;
  
  // Free: apenas 3 primeiras aulas GLOBAIS do iniciante
  const isFreeLesson = courseLevel === 'iniciante' && globalLessonIndex <= 3;
  
  // Gold: iniciante completo + até 7ª aula GLOBAL do intermediário
  const isGoldLesson = 
    courseLevel === 'iniciante' ||
    (courseLevel === 'moderado' && globalLessonIndex <= 7);
  
  return {
    freeAccess: isFreeLesson,
    goldAccess: isGoldLesson,
    premiumAccess: true,
  };
}
