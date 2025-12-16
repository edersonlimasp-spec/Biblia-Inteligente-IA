import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  userName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const subject = "Redefinição de senha – Bíblia Inteligente IA";
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinição de Senha</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #1A5299 0%, #2563eb 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Bíblia Inteligente IA</h1>
    </div>
    <div style="padding: 30px;">
      <h2 style="color: #1A5299; margin-top: 0;">Olá${userName ? `, ${userName}` : ''}!</h2>
      <p style="color: #4a5568; line-height: 1.6;">Você solicitou a redefinição de senha da sua conta. Clique no botão abaixo para criar uma nova senha:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #1A5299; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Redefinir Minha Senha</a>
      </div>
      <p style="color: #718096; font-size: 14px; line-height: 1.5;">Ou copie e cole este link no seu navegador:</p>
      <p style="color: #1A5299; font-size: 12px; word-break: break-all; background-color: #f7fafc; padding: 10px; border-radius: 4px;">${resetLink}</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
      <p style="color: #a0aec0; font-size: 12px;">⏰ Este link expira em <strong>30 minutos</strong>.</p>
      <p style="color: #a0aec0; font-size: 12px;">Se você não solicitou esta redefinição, ignore este email. Sua senha não será alterada.</p>
    </div>
    <div style="background-color: #f7fafc; padding: 20px; text-align: center;">
      <p style="color: #a0aec0; font-size: 12px; margin: 0;">Bíblia Inteligente IA - Estudo Bíblico com Inteligência Artificial</p>
    </div>
  </div>
</body>
</html>
    `;

    const textBody = `
Olá ${userName || email},

Você solicitou a redefinição de senha da sua conta na Bíblia Inteligente IA.

Clique no link abaixo para redefinir sua senha:

${resetLink}

IMPORTANTE: Este link expira em 30 minutos.

Se você não solicitou esta redefinição, ignore este email. Sua senha não será alterada.

---
Bíblia Inteligente IA
    `;

    if (!resend) {
      console.log("========================================");
      console.log("📧 [DEV] Email de Reset de Senha (Resend não configurado)");
      console.log("========================================");
      console.log(`Para: ${email}`);
      console.log(`Assunto: ${subject}`);
      console.log("----------------------------------------");
      console.log(textBody);
      console.log("========================================");
      
      return {
        success: true,
        message: "Email de reset enviado (modo desenvolvimento - veja o console)",
      };
    }

    console.log(`📧 Enviando email de reset para: ${email}`);
    
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Bíblia Inteligente IA <noreply@bibliainteligente.com.br>';
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: subject,
      html: htmlBody,
      text: textBody,
    });

    if (error) {
      console.error("❌ Erro ao enviar email via Resend:", error);
      return {
        success: false,
        message: "Erro ao enviar email. Tente novamente mais tarde.",
      };
    }

    console.log(`✅ Email enviado com sucesso! ID: ${data?.id}`);
    
    return {
      success: true,
      message: "Link de reset foi enviado para seu email. Verifique sua caixa de entrada.",
    };
  } catch (error: any) {
    console.error("❌ Email sending error:", error);
    return {
      success: false,
      message: "Erro ao enviar email de reset. Tente novamente mais tarde.",
    };
  }
}
