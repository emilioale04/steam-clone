/**
 * Servicio de Email - Notificaciones por Correo Electrónico
 * Utiliza nodemailer para enviar emails a desarrolladores
 * 
 * Seguridad implementada:
 * - Sanitización XSS en todas las entradas
 * - Rate limiting por usuario
 * - Validación de emails
 * - TLS seguro en producción
 * - Timeouts configurables
 * - Auditoría completa
 * - Manejo seguro de errores
 */

import nodemailer from 'nodemailer';
import { supabaseAdmin } from '../config/supabase.js';

class EmailService {
    constructor() {
        this.transporter = null;
        this.fromEmail = process.env.EMAIL_FROM || 'noreply@steamclone.com';
        this.fromName = process.env.EMAIL_FROM_NAME || 'Steam Clone Platform';
        this.isProduction = process.env.NODE_ENV === 'production';
        
        // Rate limiting: Map<userId, { count, resetTime }>
        this.rateLimitMap = new Map();
        this.MAX_EMAILS_PER_HOUR = 10; // Máximo 10 emails por hora por usuario
        this.RATE_LIMIT_WINDOW = 3600000; // 1 hora en ms
        
        this.initialize();
    }

    /**
     * Sanitizar texto para prevenir XSS
     */
    sanitizeHTML(text) {
        if (!text) return '';
        
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Validar formato de email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Verificar rate limiting
     */
    checkRateLimit(userId) {
        const now = Date.now();
        const record = this.rateLimitMap.get(userId);

        // Limpiar registros antiguos periódicamente
        if (this.rateLimitMap.size > 1000) {
            this.cleanupRateLimits();
        }

        if (!record || now > record.resetTime) {
            // Nueva ventana de tiempo
            this.rateLimitMap.set(userId, {
                count: 1,
                resetTime: now + this.RATE_LIMIT_WINDOW
            });
            return true;
        }

        if (record.count >= this.MAX_EMAILS_PER_HOUR) {
            const minutesLeft = Math.ceil((record.resetTime - now) / 60000);
            return false;
        }

        record.count++;
        return true;
    }

    /**
     * Limpiar rate limits expirados
     */
    cleanupRateLimits() {
        const now = Date.now();
        for (const [userId, record] of this.rateLimitMap.entries()) {
            if (now > record.resetTime) {
                this.rateLimitMap.delete(userId);
            }
        }
    }

    /**
     * Inicializar el transportador de email
     */
    initialize() {
        try {
            // Configuración SMTP
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                tls: {
                    // En producción, siempre verificar certificados
                    rejectUnauthorized: this.isProduction
                },
                // Timeouts para prevenir cuelgues
                connectionTimeout: 10000, // 10 segundos
                greetingTimeout: 10000,
                socketTimeout: 15000
            });

            console.log('[EMAIL] Servicio de email inicializado');
            
            if (!this.isProduction) {
                console.warn('[EMAIL] ADVERTENCIA: TLS en modo inseguro (desarrollo)');
            }
        } catch (error) {
            console.error('[EMAIL] Error inicializando servicio de email:', error.message);
        }
    }

    /**
     * Verificar conexión SMTP
     */
    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('[EMAIL] Conexión SMTP verificada correctamente');
            return true;
        } catch (error) {
            console.error('[EMAIL] Error verificando conexión SMTP:', error.message);
            return false;
        }
    }

    /**
     * Registrar evento de email en audit logs
     */
    async logEmailEvent(userId, action, recipient, success, errorMessage = null) {
        try {
            await supabaseAdmin.from('audit_logs').insert({
                user_id: userId,
                action: action,
                resource: 'email_notification',
                details: {
                    recipient: this.isProduction ? '[REDACTED]' : recipient, // Proteger emails en prod
                    success: success,
                    error: errorMessage,
                    timestamp: new Date().toISOString()
                },
                ip_address: null,
                resultado: success ? 'exito' : 'fallo'
            });
        } catch (error) {
            console.error('[EMAIL] Error registrando audit log:', error.message);
        }
    }

    /**
     * Obtener email del desarrollador desde auth.users
     */
    async getDeveloperEmail(desarrolladorId) {
        try {
            // Obtener email desde auth.users
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(desarrolladorId);

            if (authError || !authData || !authData.user) {
                await this.logEmailEvent(desarrolladorId, 'get_developer_email', null, false, 'User not found');
                return null;
            }

            const userEmail = authData.user.email;

            // Validar formato de email
            if (!this.isValidEmail(userEmail)) {
                await this.logEmailEvent(desarrolladorId, 'get_developer_email', userEmail, false, 'Invalid email format');
                return null;
            }

            // Obtener nombre del estudio desde tabla desarrolladores
            const { data: developer } = await supabaseAdmin
                .from('desarrolladores')
                .select('nombre_estudio')
                .eq('id', desarrolladorId)
                .single();

            const nombre = this.sanitizeHTML(developer?.nombre_estudio || 'Desarrollador');

            return {
                email: userEmail,
                nombre: nombre
            };
        } catch (error) {
            await this.logEmailEvent(desarrolladorId, 'get_developer_email', null, false, error.message);
            return null;
        }
    }

    /**
     * Plantilla HTML para aprobación de juego
     */
    getApprovalTemplate(gameName, comentarios, developerName) {
        // Sanitizar todas las entradas
        const safeGameName = this.sanitizeHTML(gameName);
        const safeComentarios = this.sanitizeHTML(comentarios);
        const safeDeveloperName = this.sanitizeHTML(developerName);
        
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Juego Aprobado</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #1b2838;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1b2838;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e2a38 0%, #2a475e 100%); border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(90deg, #66c0f4 0%, #4a9fd8 100%); padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                ✅ ¡Juego Aprobado!
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px; color: #c7d5e0;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                                Hola <strong style="color: #66c0f4;">${safeDeveloperName}</strong>,
                            </p>
                            <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                                ¡Excelentes noticias! Tu juego <strong style="color: #66c0f4;">"${safeGameName}"</strong> ha sido aprobado por nuestro equipo de revisión.
                            </p>
                            
                            ${safeComentarios ? `
                            <div style="background-color: #16202d; border-left: 4px solid #66c0f4; padding: 20px; margin: 30px 0; border-radius: 4px;">
                                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #66c0f4; text-transform: uppercase;">
                                    Comentarios del Equipo de Revisión:
                                </p>
                                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #8f98a0; white-space: pre-wrap;">
                                    ${safeComentarios}
                                </p>
                            </div>
                            ` : ''}
                            
                            <div style="background-color: #2a475e; border-radius: 6px; padding: 25px; margin: 30px 0; text-align: center;">
                                <p style="margin: 0 0 15px 0; font-size: 15px; color: #c7d5e0;">
                                    Tu juego ya está disponible en la plataforma
                                </p>
                                <a href="${process.env.FRONTEND_DEV_URL || 'http://localhost:5174'}/my-apps" 
                                   style="display: inline-block; background: linear-gradient(90deg, #66c0f4 0%, #4a9fd8 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 4px; font-weight: bold; font-size: 16px; margin-top: 10px;">
                                    Ver Mis Aplicaciones
                                </a>
                            </div>
                            
                            <p style="margin: 30px 0 0 0; font-size: 15px; line-height: 1.6;">
                                ¡Felicidades por este logro! Esperamos que tu juego tenga mucho éxito.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #16202d; padding: 25px 30px; text-align: center; border-top: 1px solid #2a475e;">
                            <p style="margin: 0; font-size: 13px; color: #8f98a0; line-height: 1.6;">
                                © 2026 Steam Clone Platform. Todos los derechos reservados.<br>
                                Este es un correo automático, por favor no respondas.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }

    /**
     * Plantilla HTML para rechazo de juego
     */
    getRejectionTemplate(gameName, comentarios, developerName) {
        // Sanitizar todas las entradas
        const safeGameName = this.sanitizeHTML(gameName);
        const safeComentarios = this.sanitizeHTML(comentarios);
        const safeDeveloperName = this.sanitizeHTML(developerName);
        
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Revisión de Juego</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #1b2838;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1b2838;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e2a38 0%, #2a475e 100%); border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(90deg, #ffc107 0%, #ff9800 100%); padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #1b2838; font-size: 28px; font-weight: bold;">
                                ⚠️ Revisión Requerida
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px; color: #c7d5e0;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                                Hola <strong style="color: #66c0f4;">${safeDeveloperName}</strong>,
                            </p>
                            <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                                Hemos revisado tu juego <strong style="color: #66c0f4;">"${safeGameName}"</strong> y necesitamos que realices algunas correcciones antes de su publicación.
                            </p>
                            
                            ${safeComentarios ? `
                            <div style="background-color: #16202d; border-left: 4px solid #ffc107; padding: 20px; margin: 30px 0; border-radius: 4px;">
                                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #ffc107; text-transform: uppercase;">
                                    Comentarios del Equipo de Revisión:
                                </p>
                                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #8f98a0; white-space: pre-wrap;">
                                    ${safeComentarios}
                                </p>
                            </div>
                            ` : ''}
                            
                            <div style="background-color: #2a475e; border-radius: 6px; padding: 25px; margin: 30px 0; text-align: center;">
                                <p style="margin: 0 0 15px 0; font-size: 15px; color: #c7d5e0;">
                                    Realiza los cambios necesarios y vuelve a enviar tu juego
                                </p>
                                <a href="${process.env.FRONTEND_DEV_URL || 'http://localhost:5174'}/my-apps" 
                                   style="display: inline-block; background: linear-gradient(90deg, #ffc107 0%, #ff9800 100%); color: #1b2838; text-decoration: none; padding: 14px 30px; border-radius: 4px; font-weight: bold; font-size: 16px; margin-top: 10px;">
                                    Ir a Mis Aplicaciones
                                </a>
                            </div>
                            
                            <p style="margin: 30px 0 0 0; font-size: 15px; line-height: 1.6;">
                                Una vez realices los cambios, podrás enviar nuevamente tu juego para revisión.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #16202d; padding: 25px 30px; text-align: center; border-top: 1px solid #2a475e;">
                            <p style="margin: 0; font-size: 13px; color: #8f98a0; line-height: 1.6;">
                                © 2026 Steam Clone Platform. Todos los derechos reservados.<br>
                                Este es un correo automático, por favor no respondas.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }

    /**
     * Enviar email con retry logic
     */
    async sendEmailWithRetry(mailOptions, maxRetries = 3) {
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const info = await this.transporter.sendMail(mailOptions);
                return { success: true, messageId: info.messageId };
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    // Exponential backoff: 2s, 4s, 8s
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        return { 
            success: false, 
            error: this.isProduction ? 'Error al enviar email' : lastError.message 
        };
    }

    /**
     * Enviar email de aprobación de juego
     */
    async sendGameApprovalEmail(desarrolladorId, gameName, comentarios = '') {
        try {
            if (!this.transporter) {
                return { success: false, error: 'Email service not configured' };
            }

            // Verificar rate limit
            if (!this.checkRateLimit(desarrolladorId)) {
                await this.logEmailEvent(desarrolladorId, 'send_approval_email', null, false, 'Rate limit exceeded');
                return { success: false, error: 'Rate limit exceeded' };
            }

            const developerInfo = await this.getDeveloperEmail(desarrolladorId);
            if (!developerInfo) {
                return { success: false, error: 'Developer email not found' };
            }

            // Truncar inputs largos para prevenir DoS
            const truncatedGameName = gameName.substring(0, 200);
            const truncatedComentarios = comentarios.substring(0, 2000);

            const htmlTemplate = this.getApprovalTemplate(truncatedGameName, truncatedComentarios, developerInfo.nombre);

            const mailOptions = {
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to: developerInfo.email,
                subject: `✅ ¡Tu juego "${this.sanitizeHTML(truncatedGameName)}" ha sido aprobado!`,
                html: htmlTemplate
            };

            const result = await this.sendEmailWithRetry(mailOptions);
            
            // Log del evento
            await this.logEmailEvent(
                desarrolladorId, 
                'send_approval_email', 
                developerInfo.email, 
                result.success,
                result.error
            );
            
            return { 
                success: result.success, 
                messageId: result.messageId,
                to: this.isProduction ? '[REDACTED]' : developerInfo.email,
                error: result.error
            };
        } catch (error) {
            await this.logEmailEvent(desarrolladorId, 'send_approval_email', null, false, error.message);
            return { success: false, error: this.isProduction ? 'Internal error' : error.message };
        }
    }

    /**
     * Enviar email de rechazo de juego
     */
    async sendGameRejectionEmail(desarrolladorId, gameName, comentarios = '') {
        try {
            if (!this.transporter) {
                return { success: false, error: 'Email service not configured' };
            }

            // Verificar rate limit
            if (!this.checkRateLimit(desarrolladorId)) {
                await this.logEmailEvent(desarrolladorId, 'send_rejection_email', null, false, 'Rate limit exceeded');
                return { success: false, error: 'Rate limit exceeded' };
            }

            const developerInfo = await this.getDeveloperEmail(desarrolladorId);
            if (!developerInfo) {
                return { success: false, error: 'Developer email not found' };
            }

            // Truncar inputs largos
            const truncatedGameName = gameName.substring(0, 200);
            const truncatedComentarios = comentarios.substring(0, 2000);

            const htmlTemplate = this.getRejectionTemplate(truncatedGameName, truncatedComentarios, developerInfo.nombre);

            const mailOptions = {
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to: developerInfo.email,
                subject: `⚠️ Revisión requerida para tu juego "${this.sanitizeHTML(truncatedGameName)}"`,
                html: htmlTemplate
            };

            const result = await this.sendEmailWithRetry(mailOptions);
            
            // Log del evento
            await this.logEmailEvent(
                desarrolladorId, 
                'send_rejection_email', 
                developerInfo.email, 
                result.success,
                result.error
            );
            
            return { 
                success: result.success, 
                messageId: result.messageId,
                to: this.isProduction ? '[REDACTED]' : developerInfo.email,
                error: result.error
            };
        } catch (error) {
            await this.logEmailEvent(desarrolladorId, 'send_rejection_email', null, false, error.message);
            return { success: false, error: this.isProduction ? 'Internal error' : error.message };
        }
    }

    /**
     * Método genérico para enviar emails
     */
    async sendEmail(to, subject, html) {
        try {
            if (!this.transporter) {
                console.log('[EMAIL] Transportador no configurado');
                return { success: false, error: 'Email service not configured' };
            }

            // Validar email
            if (!this.isValidEmail(to)) {
                console.error('[EMAIL] Email destino inválido');
                return { success: false, error: 'Invalid email address' };
            }

            // Sanitizar subject
            const safeSubject = this.sanitizeHTML(subject).substring(0, 200);

            const mailOptions = {
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to: to,
                subject: safeSubject,
                html: html
            };

            const result = await this.sendEmailWithRetry(mailOptions);
            
            if (result.success) {
                console.log('[EMAIL] Email enviado:', result.messageId);
            }
            
            return { 
                success: result.success, 
                messageId: result.messageId,
                error: result.error
            };
        } catch (error) {
            console.error('[EMAIL] Error enviando email:', error.message);
            return { success: false, error: this.isProduction ? 'Internal error' : error.message };
        }
    }
}

export const emailService = new EmailService();
