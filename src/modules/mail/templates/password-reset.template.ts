export function getPasswordResetEmailHtml(
  fullName: string,
  resetUrl: string,
  expiresInMinutes: number,
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a2e;">Resetea tu contraseña</h1>
  <p>Hola ${fullName},</p>
  <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta de SpendWise.</p>
  <p>Haz clic en el siguiente enlace para continuar:</p>
  <p style="margin: 24px 0;">
    <a href="${resetUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Restablecer contraseña</a>
  </p>
  <p style="color: #666; font-size: 14px;">Este enlace expirará en ${expiresInMinutes} minutos.</p>
  <p style="color: #666; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">SpendWise - Tu gestor de gastos inteligente</p>
</body>
</html>
  `.trim();
}
