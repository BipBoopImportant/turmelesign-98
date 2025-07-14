import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EmailRequest {
  documentId: string;
  signerEmail: string;
  signerName: string;
  documentName: string;
  message?: string;
  language?: 'en' | 'fr-ca';
}

// Domain resolution utility
class DomainResolver {
  private static readonly FALLBACK_DOMAIN = 'https://preview--turmelesign-19.lovable.app';
  
  static resolveAppDomain(request: Request): string {
    try {
      // Try to get domain from request headers (most reliable)
      const origin = request.headers.get('origin');
      const referer = request.headers.get('referer');
      
      if (origin) {
        console.log('Domain resolved from origin header:', origin);
        return origin;
      }
      
      if (referer) {
        const url = new URL(referer);
        const domain = `${url.protocol}//${url.host}`;
        console.log('Domain resolved from referer header:', domain);
        return domain;
      }
      
      // Try to extract from x-forwarded-host or host headers
      const forwardedHost = request.headers.get('x-forwarded-host');
      const host = request.headers.get('host');
      
      if (forwardedHost) {
        const domain = `https://${forwardedHost}`;
        console.log('Domain resolved from x-forwarded-host:', domain);
        return domain;
      }
      
      if (host) {
        // Determine protocol based on host pattern
        const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
        const domain = `${protocol}://${host}`;
        console.log('Domain resolved from host header:', domain);
        return domain;
      }
      
      console.log('Using fallback domain:', this.FALLBACK_DOMAIN);
      return this.FALLBACK_DOMAIN;
      
    } catch (error) {
      console.error('Error resolving domain:', error);
      console.log('Using fallback domain due to error:', this.FALLBACK_DOMAIN);
      return this.FALLBACK_DOMAIN;
    }
  }
  
  static createSigningUrl(appDomain: string, documentId: string, signerEmail: string): string {
    const encodedEmail = encodeURIComponent(signerEmail);
    const signingUrl = `${appDomain}/sign/${documentId}/${encodedEmail}`;
    console.log('Generated signing URL:', signingUrl);
    return signingUrl;
  }
}

// Email template processor
class EmailTemplateProcessor {
  static processTemplate(template: any, variables: any, language: 'en' | 'fr-ca' = 'en'): { subject: string; content: string } {
    const placeholderMap: Record<string, string> = {
      '{{document_name}}': variables.document_name,
      '{{signer_name}}': variables.signer_name,
      '{{sender_name}}': variables.sender_name,
      '{{signing_url}}': variables.signing_url,
      '{{message}}': variables.message || ''
    };

    let subject = template.subject_template;
    let content = template.body_template;

    // Replace all variables
    Object.entries(placeholderMap).forEach(([placeholder, value]) => {
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      subject = subject.replace(regex, value);
      content = content.replace(regex, value);
    });

    // Wrap template content in basic HTML structure if it doesn't have it
    if (!content.includes('<html>')) {
      content = this.wrapInHtmlStructure(content);
    }

    return { subject, content };
  }

  static createDefaultTemplate(variables: any, language: 'en' | 'fr-ca' = 'en'): { subject: string; content: string } {
    const isEnglish = language === 'en';
    const subject = isEnglish 
      ? `Signature Request: ${variables.document_name}`
      : `Demande de signature: ${variables.document_name}`;
    
    const content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Document Signature Request</title>
    <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0;
          background-color: #f8fafc;
        }
        .container { 
          max-width: 600px; 
          margin: 40px auto; 
          padding: 0 20px;
        }
        .card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 32px 24px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 24px;
          color: #374151;
        }
        .document-info {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin: 24px 0;
        }
        .document-name {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .message-section {
          margin: 24px 0;
          padding: 16px;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 0 8px 8px 0;
        }
        .message-label {
          font-weight: 600;
          color: #92400e;
          margin-bottom: 8px;
        }
        .cta-section {
          text-align: center;
          margin: 32px 0;
        }
        .cta-button { 
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s;
        }
        .cta-button:hover {
          transform: translateY(-1px);
        }
        .backup-link {
          margin-top: 24px;
          padding: 16px;
          background: #f3f4f6;
          border-radius: 8px;
        }
        .backup-link p {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #6b7280;
        }
        .backup-url {
          word-break: break-all; 
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          background: #e5e7eb; 
          padding: 12px; 
          border-radius: 6px;
          font-size: 13px;
          color: #374151;
        }
        .footer { 
          margin-top: 40px; 
          padding: 24px; 
          border-top: 1px solid #e5e7eb; 
          font-size: 13px; 
          color: #6b7280;
          text-align: center;
        }
        .footer-brand {
          font-weight: 600;
          color: #4f46e5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <h1>${isEnglish ? 'Document Signature Request' : 'Demande de signature de document'}</h1>
            </div>
            
            <div class="content">
                <div class="greeting">
                    ${isEnglish ? `Hello ${variables.signer_name},` : `Bonjour ${variables.signer_name},`}
                </div>
                
                <p>${isEnglish 
                  ? 'You have been requested to sign the following document:' 
                  : 'On vous demande de signer le document suivant :'}</p>
                
                <div class="document-info">
                    <div class="document-name">${variables.document_name}</div>
                    <div style="font-size: 14px; color: #6b7280;">${isEnglish 
                      ? `Requested by ${variables.sender_name}` 
                      : `Demandé par ${variables.sender_name}`}</div>
                </div>
                
                ${variables.message ? `
                <div class="message-section">
                    <div class="message-label">${isEnglish ? 'Personal Message:' : 'Message personnel :'}</div>
                    <div style="color: #92400e;">${variables.message}</div>
                </div>` : ''}
                
                <div class="cta-section">
                    <a href="${variables.signing_url}" class="cta-button">
                        ${isEnglish ? 'Review & Sign Document' : 'Examiner et signer le document'}
                    </a>
                </div>
                
                <div class="backup-link">
                    <p>${isEnglish 
                      ? "If the button above doesn't work, copy and paste this link into your browser:" 
                      : "Si le bouton ci-dessus ne fonctionne pas, copiez et collez ce lien dans votre navigateur :"}</p>
                    <div class="backup-url">${variables.signing_url}</div>
                </div>
            </div>
            
            <div class="footer">
                <p>${isEnglish 
                  ? 'This is an automated message. Please do not reply to this email.' 
                  : 'Ceci est un message automatisé. Veuillez ne pas répondre à ce courriel.'}</p>
                <p>${isEnglish 
                  ? 'Sent securely via <span class="footer-brand">TurmelEsign</span>' 
                  : 'Envoyé de manière sécurisée via <span class="footer-brand">TurmelEsign</span>'}</p>
            </div>
        </div>
    </div>
</body>
</html>`;

    return { subject, content };
  }

  private static wrapInHtmlStructure(content: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Document Signature Request</title>
    <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 20px;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 32px;
        }
    </style>
</head>
<body>
    <div class="container">
        ${content}
    </div>
</body>
</html>`;
  }
}

// SMTP Client
class SMTPClient {
  private textEncoder = new TextEncoder();
  private textDecoder = new TextDecoder();

  async sendEmail(emailData: any, smtpConfig: any): Promise<any> {
    let conn: Deno.TcpConn | Deno.TlsConn;

    try {
      console.log("Sending email via SMTP to:", smtpConfig.smtp_host, "port:", smtpConfig.smtp_port);
      
      // Create connection based on port
      if (smtpConfig.smtp_port === 465) {
        // Port 465 uses implicit SSL/TLS
        conn = await Deno.connectTls({
          hostname: smtpConfig.smtp_host,
          port: smtpConfig.smtp_port,
        });
      } else {
        // Other ports (587, 25) use plain connection first
        conn = await Deno.connect({
          hostname: smtpConfig.smtp_host,
          port: smtpConfig.smtp_port,
        });
      }

      // Wait for initial greeting
      let response = await this.readResponse(conn);
      if (!response.startsWith("220")) {
        throw new Error(`SMTP connection failed: ${response}`);
      }

      // Send EHLO
      response = await this.sendCommand(conn, `EHLO ${smtpConfig.smtp_host}\r\n`);
      if (!response.startsWith("250")) {
        throw new Error(`EHLO failed: ${response}`);
      }

      // Handle STARTTLS for non-465 ports
      if (smtpConfig.use_tls && smtpConfig.smtp_port !== 465) {
        response = await this.sendCommand(conn, "STARTTLS\r\n");
        if (!response.startsWith("220")) {
          throw new Error(`STARTTLS failed: ${response}`);
        }
        
        // Upgrade connection to TLS
        conn = await Deno.startTls(conn, { hostname: smtpConfig.smtp_host });
        
        // Send EHLO again after TLS
        response = await this.sendCommand(conn, `EHLO ${smtpConfig.smtp_host}\r\n`);
        if (!response.startsWith("250")) {
          throw new Error(`EHLO after TLS failed: ${response}`);
        }
      }

      // Authentication
      await this.authenticate(conn, smtpConfig);

      // Send email
      await this.sendEmailData(conn, emailData);

      // QUIT
      await this.sendCommand(conn, "QUIT\r\n");
      conn.close();

      return { success: true };

    } catch (error: any) {
      console.error("SMTP Error:", error);
      return { success: false, error: error.message };
    }
  }

  private async readResponse(conn: Deno.TcpConn | Deno.TlsConn): Promise<string> {
    const buffer = new Uint8Array(4096);
    let response = "";
    let attempts = 0;
    
    while (attempts < 10) {
      try {
        const bytesRead = await conn.read(buffer);
        if (bytesRead === null) break;
        
        const chunk = this.textDecoder.decode(buffer.subarray(0, bytesRead));
        response += chunk;
        
        if (response.endsWith('\r\n')) break;
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log("SMTP Response:", response.trim());
    return response.trim();
  }

  private async sendCommand(conn: Deno.TcpConn | Deno.TlsConn, command: string): Promise<string> {
    console.log("SMTP Command:", command.replace(/\r\n$/, ''));
    await conn.write(this.textEncoder.encode(command));
    return await this.readResponse(conn);
  }

  private async authenticate(conn: Deno.TcpConn | Deno.TlsConn, config: any): Promise<void> {
    let response = await this.sendCommand(conn, "AUTH LOGIN\r\n");
    if (!response.startsWith("334")) {
      throw new Error(`AUTH LOGIN failed: ${response}`);
    }

    // Send username (base64 encoded)
    const username = btoa(config.smtp_username);
    response = await this.sendCommand(conn, `${username}\r\n`);
    if (!response.startsWith("334")) {
      throw new Error(`Username authentication failed: ${response}`);
    }

    // Send password (base64 encoded)
    const password = btoa(config.smtp_password);
    response = await this.sendCommand(conn, `${password}\r\n`);
    if (!response.startsWith("235")) {
      throw new Error(`Password authentication failed: ${response}`);
    }
  }

  private async sendEmailData(conn: Deno.TcpConn | Deno.TlsConn, emailData: any): Promise<void> {
    // Extract email address from "Display Name <email@domain.com>" format
    const fromEmail = emailData.from.includes('<') 
      ? emailData.from.match(/<([^>]+)>/)?.[1] || emailData.from
      : emailData.from;

    // MAIL FROM
    let response = await this.sendCommand(conn, `MAIL FROM:<${fromEmail}>\r\n`);
    if (!response.startsWith("250")) {
      throw new Error(`MAIL FROM failed: ${response}`);
    }

    // RCPT TO
    response = await this.sendCommand(conn, `RCPT TO:<${emailData.to}>\r\n`);
    if (!response.startsWith("250")) {
      throw new Error(`RCPT TO failed: ${response}`);
    }

    // DATA command
    response = await this.sendCommand(conn, "DATA\r\n");
    if (!response.startsWith("354")) {
      throw new Error(`DATA command failed: ${response}`);
    }

    // Prepare email message with proper headers
    const emailMessage = [
      `From: ${emailData.from}`,
      `To: ${emailData.to}`,
      `Subject: ${emailData.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      `Date: ${new Date().toUTCString()}`,
      ``,
      emailData.html,
      ``,
      `.`,
      ``
    ].join('\r\n');

    // Send email content
    await conn.write(this.textEncoder.encode(emailMessage));
    response = await this.readResponse(conn);
    
    if (!response.startsWith("250")) {
      throw new Error(`Email sending failed: ${response}`);
    }
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Authentication failed");
    }

    const { documentId, signerEmail, signerName, documentName, message, language = 'en' }: EmailRequest = await req.json();

    console.log("Sending signing email for document:", documentId, "to:", signerEmail);

    // Get user's default email configuration
    const { data: emailConfig, error: configError } = await supabase
      .from("email_configurations")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .single();

    if (configError || !emailConfig) {
      throw new Error("No default email configuration found. Please set up your email configuration first.");
    }

    // Get default email template for this configuration
    const { data: emailTemplate } = await supabase
      .from("email_templates")
      .select("*")
      .eq("email_config_id", emailConfig.id)
      .eq("is_default", true)
      .single();

    // Resolve current app domain and create signing URL
    const appDomain = DomainResolver.resolveAppDomain(req);
    const signingUrl = DomainResolver.createSigningUrl(appDomain, documentId, signerEmail);

    // Prepare template variables
    const templateVariables = {
      document_name: documentName,
      signer_name: signerName,
      sender_name: emailConfig.display_name || emailConfig.email_address,
      signing_url: signingUrl,
      message: message
    };

    // Process email content using template or default
    let emailSubject: string;
    let emailContent: string;

    if (emailTemplate) {
      const processed = EmailTemplateProcessor.processTemplate(emailTemplate, templateVariables, language);
      emailSubject = processed.subject;
      emailContent = processed.content;
    } else {
      const defaultTemplate = EmailTemplateProcessor.createDefaultTemplate(templateVariables, language);
      emailSubject = defaultTemplate.subject;
      emailContent = defaultTemplate.content;
    }

    // Prepare email data
    const emailData = {
      from: emailConfig.display_name 
        ? `${emailConfig.display_name} <${emailConfig.email_address}>` 
        : emailConfig.email_address,
      to: signerEmail,
      subject: emailSubject,
      html: emailContent,
    };

    // Send email using optimized SMTP client
    const smtpClient = new SMTPClient();
    const emailResponse = await smtpClient.sendEmail(emailData, emailConfig);

    if (!emailResponse.success) {
      throw new Error(emailResponse.error || "Failed to send email");
    }

    console.log("Email sent successfully to:", signerEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Signing invitation sent successfully",
        signingUrl 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-signing-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);