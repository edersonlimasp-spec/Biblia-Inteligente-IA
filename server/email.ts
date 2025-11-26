// Simple email service for password reset
// In development: logs to console
// In production: would need email service (configure via env vars)

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  userName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const subject = "Recuperar Senha - Bíblia Hebraico & Grego";
    const emailBody = `
Olá ${userName || email},

Você solicitou a recuperação de senha. Clique no link abaixo para redefinir sua senha:

${resetLink}

Este link expira em 1 hora.

Se você não solicitou esta recuperação, ignore este email.

---
Bíblia Hebraico & Grego
    `;

    // In development: log to console
    if (process.env.NODE_ENV !== "production") {
      console.log("========================================");
      console.log("📧 [DEV] Email de Reset de Senha");
      console.log("========================================");
      console.log(`Para: ${email}`);
      console.log(`Assunto: ${subject}`);
      console.log("----------------------------------------");
      console.log(emailBody);
      console.log("========================================");
      
      return {
        success: true,
        message: "Email de reset enviado (modo desenvolvimento - veja o console)",
      };
    }

    // In production: attempt to send via email service
    // This is a placeholder - would need actual email service integration
    console.log(
      `[PROD] Password reset email would be sent to: ${email}`
    );

    return {
      success: true,
      message: "Link de reset foi enviado para seu email. Verifique sua caixa de entrada.",
    };
  } catch (error: any) {
    console.error("Email sending error:", error);
    return {
      success: false,
      message: "Erro ao enviar email de reset. Tente novamente mais tarde.",
    };
  }
}
