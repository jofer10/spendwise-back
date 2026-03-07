import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';

export interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class MailService {
  private resend: Resend | null = null;

  constructor(private readonly config: ConfigService) {}

  private getClient(): Resend | null {
    if (this.resend) return this.resend;

    const apiKey = this.config.get<string>('email.apiKey');
    if (!apiKey) {
      return null;
    }

    this.resend = new Resend(apiKey);
    return this.resend;
  }

  async send(options: MailOptions): Promise<boolean> {
    const client = this.getClient();
    if (!client) {
      console.warn('[MailService] Resend API key not configured, email not sent:', options);
      return false;
    }

    try {
      const html = options.html ?? options.text ?? '';
      const text = options.text ?? options.html ?? '';
      const { error } = await client.emails.send({
        from: this.config.get<string>('email.from', 'onboarding@resend.dev'),
        to: options.to,
        subject: options.subject,
        html: html || '(sin contenido)',
        text: text || '(sin contenido)',
      });

      if (error) {
        console.error('[MailService] Resend error:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[MailService] Failed to send email:', err);
      return false;
    }
  }
}
