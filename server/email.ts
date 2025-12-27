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
    
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Bíblia Inteligente IA <noreply@bibliainteligente.replit.app>';
    
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

export async function sendReengagementEmail(
  email: string,
  userName?: string,
  unsubscribeLink?: string
): Promise<{ success: boolean; message: string; messageId?: string }> {
  try {
    const appUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'https://bibliainteligente.replit.app';
    
    const subject = "Sentimos sua falta - Novidades na Bíblia Inteligente IA";
    
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sentimos sua falta</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #1A5299 0%, #2563eb 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Bíblia Inteligente IA</h1>
    </div>
    <div style="padding: 30px;">
      <h2 style="color: #1A5299; margin-top: 0;">Olá${userName ? `, ${userName}` : ''}!</h2>
      
      <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
        Sentimos sua falta! Faz um tempinho que você não aparece por aqui, e temos muitas novidades esperando por você.
      </p>
      
      <div style="background-color: #f0f9ff; border-left: 4px solid #1A5299; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="color: #1A5299; margin-top: 0; font-size: 16px;">O que há de novo:</h3>
        <ul style="color: #4a5568; line-height: 1.8; padding-left: 20px; margin-bottom: 0;">
          <li><strong>Professor IA</strong> - Tire suas dúvidas bíblicas com inteligência artificial</li>
          <li><strong>Dicionário Strong</strong> - Explore as palavras originais em hebraico e grego</li>
          <li><strong>Múltiplas versões</strong> - ACF, ARC, NVI, KJV e mais</li>
          <li><strong>Anotações pessoais</strong> - Salve suas reflexões em cada versículo</li>
        </ul>
      </div>
      
      <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
        Volte a estudar a Palavra e aprofunde sua fé com as ferramentas que preparamos para você!
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${appUrl}" style="background-color: #1A5299; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">Voltar a Estudar a Palavra</a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
      
      <p style="color: #a0aec0; font-size: 12px; text-align: center;">
        Este email foi enviado por Bíblia Inteligente IA<br>
        ${unsubscribeLink ? `<a href="${unsubscribeLink}" style="color: #a0aec0;">Cancelar inscrição</a>` : ''}
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const textBody = `
Olá${userName ? `, ${userName}` : ''}!

Sentimos sua falta! Faz um tempinho que você não aparece por aqui, e temos muitas novidades esperando por você.

O que há de novo:
- Professor IA - Tire suas dúvidas bíblicas com inteligência artificial
- Dicionário Strong - Explore as palavras originais em hebraico e grego
- Múltiplas versões - ACF, ARC, NVI, KJV e mais
- Anotações pessoais - Salve suas reflexões em cada versículo

Volte a estudar a Palavra e aprofunde sua fé!

Acesse: ${appUrl}

---
Enviado por Bíblia Inteligente IA
${unsubscribeLink ? `\nPara cancelar inscrição: ${unsubscribeLink}` : ''}
    `;

    if (!resend) {
      console.log("========================================");
      console.log("[Campaign] Email de Reengajamento (Resend não configurado)");
      console.log("========================================");
      console.log(`Para: ${email}`);
      console.log(`Assunto: ${subject}`);
      console.log("----------------------------------------");
      console.log(textBody);
      console.log("========================================");
      
      return {
        success: true,
        message: "Email enviado (modo desenvolvimento)",
        messageId: "dev-" + Date.now(),
      };
    }

    console.log(`[Campaign] Enviando email de reengajamento para: ${email}`);
    
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Bíblia Inteligente IA <noreply@bibliainteligente.replit.app>';
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: subject,
      html: htmlBody,
      text: textBody,
    });

    if (error) {
      console.error("[Campaign] Erro ao enviar email:", error);
      return {
        success: false,
        message: error.message || "Erro ao enviar email",
      };
    }

    console.log(`[Campaign] Email enviado com sucesso! ID: ${data?.id}`);
    
    return {
      success: true,
      message: "Email de reengajamento enviado",
      messageId: data?.id,
    };
  } catch (error: any) {
    console.error("[Campaign] Erro ao enviar email:", error);
    return {
      success: false,
      message: error.message || "Erro interno ao enviar email",
    };
  }
}
