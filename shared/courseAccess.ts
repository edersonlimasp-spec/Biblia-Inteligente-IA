export type UserPlan = 'free' | 'gold' | 'premium';
export type CourseLevel = 'iniciante' | 'moderado' | 'avancado';

export interface CanOpenLessonParams {
  isLoggedIn: boolean;
  plan: UserPlan;
  courseLevel: CourseLevel;
  moduleIndex: number;
  lessonIndex: number;
  isAdmin?: boolean;
}

export interface AccessResult {
  allowed: boolean;
  reason: 'NOT_AUTHENTICATED' | 'UPGRADE_REQUIRED' | 'ALLOWED';
  requiredPlan?: 'gold' | 'premium';
  message?: string;
}

export function canOpenLesson(params: CanOpenLessonParams): AccessResult {
  const { isLoggedIn, plan, courseLevel, moduleIndex, lessonIndex, isAdmin = false } = params;
  
  // Admin always has access
  if (isAdmin) {
    return { allowed: true, reason: 'ALLOWED' };
  }
  
  // First 3 lessons of first module are FREE for everyone (even without login)
  if (courseLevel === 'iniciante' && moduleIndex === 1 && lessonIndex <= 3) {
    return { allowed: true, reason: 'ALLOWED' };
  }
  
  // For all other content, require authentication
  if (!isLoggedIn) {
    return { 
      allowed: false, 
      reason: 'NOT_AUTHENTICATED',
      message: 'Entre ou crie uma conta para continuar'
    };
  }
  
  // Premium has access to everything
  if (plan === 'premium') {
    return { allowed: true, reason: 'ALLOWED' };
  }
  
  // Gold access rules
  if (plan === 'gold') {
    if (courseLevel === 'iniciante') {
      return { allowed: true, reason: 'ALLOWED' };
    }
    if (courseLevel === 'moderado') {
      if (lessonIndex <= 7) {
        return { allowed: true, reason: 'ALLOWED' };
      }
      return {
        allowed: false,
        reason: 'UPGRADE_REQUIRED',
        requiredPlan: 'premium',
        message: 'Assine Premium para liberar Moderado completo e Avançado'
      };
    }
    if (courseLevel === 'avancado') {
      return {
        allowed: false,
        reason: 'UPGRADE_REQUIRED',
        requiredPlan: 'premium',
        message: 'Assine Premium para liberar o Avançado'
      };
    }
  }
  
  // Free plan - only iniciante content requires upgrade (first 3 lessons already handled above)
  if (courseLevel === 'iniciante') {
    return {
      allowed: false,
      reason: 'UPGRADE_REQUIRED',
      requiredPlan: 'gold',
      message: 'Assine Gold para liberar o Iniciante completo'
    };
  }
  
  return {
    allowed: false,
    reason: 'UPGRADE_REQUIRED',
    requiredPlan: 'gold',
    message: 'Assine no mínimo Gold para acessar este conteúdo'
  };
}

export function getLessonAccessInfo(params: Omit<CanOpenLessonParams, 'isLoggedIn' | 'plan'> & { isLoggedIn?: boolean; plan?: UserPlan }): {
  freeAccess: boolean;
  goldAccess: boolean;
  premiumAccess: boolean;
} {
  const { courseLevel, moduleIndex, lessonIndex, isAdmin = false } = params;
  
  if (isAdmin) {
    return { freeAccess: true, goldAccess: true, premiumAccess: true };
  }
  
  const isFreeLesson = courseLevel === 'iniciante' && moduleIndex === 1 && lessonIndex <= 3;
  const isGoldLesson = 
    courseLevel === 'iniciante' ||
    (courseLevel === 'moderado' && lessonIndex <= 7);
  
  return {
    freeAccess: isFreeLesson,
    goldAccess: isGoldLesson,
    premiumAccess: true,
  };
}
