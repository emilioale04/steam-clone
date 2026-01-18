/**
 * Servicio de Autenticación para Desarrolladores (Steamworks)
 * Utiliza Supabase Auth con tabla extendida 'desarrolladores'
 * Cumple con: RF-001, RF-002, RNF-001, C14, C15, C18
 *
 * Grupo 2 - Con seguridad mejorada:
 * - C3: Sanitización de inputs
 * - C2: Cifrado de datos bancarios
 * - RNF-008: Auditoría de acciones
 * - C15: Gestión robusta de sesiones
 * - RNF-001: MFA automático
 */

import supabase, { supabaseAdmin } from '../../../shared/config/supabase.js';
import {
  sanitizeString,
  sanitizeEmail,
  isValidEmail,
  containsSQLInjection,
} from '../../../shared/utils/sanitization.js';
import {
  encryptBankData,
  decryptBankData,
} from '../../../shared/utils/encryption.js';
import {
  auditService,
  ACCIONES_AUDITORIA,
  RESULTADOS,
} from '../../../shared/services/auditService.js';
import { sessionService } from '../../../shared/services/sessionService.js';

export const developerAuthService = {
  /**
   * Registro de nuevo desarrollador (RF-001)
   * Crea usuario en Supabase Auth + registro en tabla desarrolladores
   * Con MFA automático (RNF-001) y logging de auditoría (RNF-008)
   */
  async registrarDesarrollador(datosRegistro, requestMetadata = {}) {
    const {
      email,
      password,
      // Datos Personales (RF-001)
      nombre_legal,
      pais,
      telefono,
      direccion,
      // Información Bancaria (RF-001)
      banco,
      numero_cuenta,
      titular_cuenta,
      // Información Fiscal
      nif_cif,
      razon_social,
      // Aceptación Legal
      acepto_terminos,
    } = datosRegistro;

    // === SANITIZACIÓN DE INPUTS (C3) ===
    const emailSanitizado = sanitizeEmail(email);
    const nombreLegalSanitizado = sanitizeString(nombre_legal);
    const paisSanitizado = sanitizeString(pais);

    // Validar email
    if (!isValidEmail(emailSanitizado)) {
      // Registrar intento fallido de registro
      await auditService.registrarEvento({
        desarrolladorId: null,
        accion: ACCIONES_AUDITORIA.REGISTRO,
        resultado: RESULTADOS.FALLIDO,
        detalles: { razon: 'Email inválido', email: emailSanitizado },
        ipAddress: requestMetadata.ip_address,
        userAgent: requestMetadata.user_agent,
      });
      throw new Error('Formato de email inválido');
    }

    // Detectar SQL injection en inputs
    if (
      containsSQLInjection(nombreLegalSanitizado) ||
      containsSQLInjection(paisSanitizado) ||
      containsSQLInjection(banco || '') ||
      containsSQLInjection(titular_cuenta || '')
    ) {
      // Registrar intento de inyección SQL
      await auditService.registrarEvento({
        desarrolladorId: null,
        accion: ACCIONES_AUDITORIA.REGISTRO,
        resultado: RESULTADOS.FALLIDO,
        detalles: {
          razon: 'Entrada inválida detectada - posible SQL injection',
          email: emailSanitizado,
          nombre_legal,
        },
        ipAddress: requestMetadata.ip_address,
        userAgent: requestMetadata.user_agent,
      });
      throw new Error('Entrada inválida detectada');
    }

    // Validar aceptación de términos (RF-001)
    if (!acepto_terminos) {
      await auditService.registrarEvento({
        desarrolladorId: null,
        accion: ACCIONES_AUDITORIA.REGISTRO,
        resultado: RESULTADOS.FALLIDO,
        detalles: {
          razon: 'Términos y condiciones no aceptados',
          email: emailSanitizado,
        },
        ipAddress: requestMetadata.ip_address,
        userAgent: requestMetadata.user_agent,
      });
      throw new Error(
        'Debe aceptar los términos y condiciones para registrarse',
      );
    }

    // === CIFRADO DE DATOS BANCARIOS (C2, RNF-003) ===
    // NOTA: Supabase ya proporciona cifrado en reposo (AES-256)
    // Esto es una capa ADICIONAL de cifrado a nivel de aplicación
    const datosBancariosCifrados = encryptBankData({
      cuenta_bancaria: numero_cuenta,
      titular_banco: titular_cuenta,
      nombre_banco: banco,
      nif_cif: nif_cif, // Cifrar NIF/CIF (dato fiscal sensible)
    });

    // 1. Crear usuario en Supabase Auth con confirmación de email
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailSanitizado,
      password,
      options: {
        data: {
          rol: 'desarrollador',
          nombre_legal: nombreLegalSanitizado,
        },
        // Enviar correo de confirmación (RF-001 extendido)
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/desarrollador/login?verified=true`,
      },
    });

    if (authError) {
      // Registrar error de autenticación
      await auditService.registrarEvento({
        desarrolladorId: null,
        accion: ACCIONES_AUDITORIA.REGISTRO,
        resultado: RESULTADOS.FALLIDO,
        detalles: {
          razon: `Error en Supabase Auth: ${authError.message}`,
          email: emailSanitizado,
          error: authError.code,
        },
        ipAddress: requestMetadata.ip_address,
        userAgent: requestMetadata.user_agent,
      });
      throw authError;
    }

    const userId = authData.user?.id;
    if (!userId) {
      await auditService.registrarEvento({
        desarrolladorId: null,
        accion: ACCIONES_AUDITORIA.REGISTRO,
        resultado: RESULTADOS.FALLIDO,
        detalles: {
          razon: 'Error al crear usuario: ID no generado',
          email: emailSanitizado,
        },
        ipAddress: requestMetadata.ip_address,
        userAgent: requestMetadata.user_agent,
      });
      throw new Error('Error al crear usuario: ID no generado');
    }

    // 2. Crear registro en tabla desarrolladores (usando supabaseAdmin para bypass RLS)
    const { data: desarrollador, error: devError } = await supabaseAdmin
      .from('desarrolladores')
      .insert({
        id: userId,
        nombre_legal: nombreLegalSanitizado,
        pais: paisSanitizado,
        telefono: sanitizeString(telefono || ''),
        direccion: sanitizeString(direccion || ''),
        banco: datosBancariosCifrados.nombre_banco,
        numero_cuenta: datosBancariosCifrados.cuenta_bancaria, // Cifrado
        titular_cuenta: datosBancariosCifrados.titular_banco,
        nif_cif: datosBancariosCifrados.nif_cif, // Cifrado
        razon_social: sanitizeString(razon_social || ''),
        rol: 'desarrollador',
        acepto_terminos: true,
        fecha_aceptacion_terminos: new Date().toISOString(),
        mfa_habilitado: true, // MFA AUTOMÁTICO (RNF-001)
        cuenta_activa: true,
      })
      .select()
      .single();

    if (devError) {
      // Rollback: eliminar usuario de auth si falla la inserción
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});

      await auditService.registrarEvento({
        desarrolladorId: null,
        accion: ACCIONES_AUDITORIA.REGISTRO,
        resultado: RESULTADOS.FALLIDO,
        detalles: {
          razon: `Error al crear perfil de desarrollador: ${devError.message}`,
          email: emailSanitizado,
          user_id: userId,
        },
        ipAddress: requestMetadata.ip_address,
        userAgent: requestMetadata.user_agent,
      });
      throw new Error(
        `Error al crear perfil de desarrollador: ${devError.message}`,
      );
    }

    // 3. Configurar MFA automáticamente (RNF-001)
    try {
      // Habilitar MFA para el usuario
      const { error: mfaError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { app_metadata: { mfa_enabled: true } },
      );

      if (mfaError) {
        console.error('Error al configurar MFA automático:', mfaError);
        // No lanzar error, solo registrar - el registro fue exitoso
        await auditService.registrarEvento({
          desarrolladorId: userId,
          accion: ACCIONES_AUDITORIA.MFA_HABILITADO,
          resultado: RESULTADOS.FALLIDO,
          detalles: {
            razon: `Error al habilitar MFA automático: ${mfaError.message}`,
            email: emailSanitizado,
          },
          ipAddress: requestMetadata.ip_address,
          userAgent: requestMetadata.user_agent,
        });
      } else {
        await auditService.registrarEvento({
          desarrolladorId: userId,
          accion: ACCIONES_AUDITORIA.MFA_HABILITADO,
          resultado: RESULTADOS.EXITOSO,
          detalles: {
            razon: 'MFA configurado automáticamente al registrarse',
            email: emailSanitizado,
          },
          ipAddress: requestMetadata.ip_address,
          userAgent: requestMetadata.user_agent,
        });
      }
    } catch (mfaConfigError) {
      console.error('Error inesperado al configurar MFA:', mfaConfigError);
    }

    // 4. Registrar evento de registro exitoso (RNF-008)
    await auditService.registrarRegistro(
      userId,
      requestMetadata.ip_address,
      requestMetadata.user_agent,
      { email: emailSanitizado },
    );

    // Descifrar datos bancarios antes de retornar (para consistencia)
    const datosDescifrados = decryptBankData({
      cuenta_bancaria: desarrollador.numero_cuenta,
      titular_banco: desarrollador.titular_cuenta,
      nombre_banco: desarrollador.banco,
      nif_cif: desarrollador.nif_cif,
    });

    const desarrolladorConDatosDescifrados = {
      ...desarrollador,
      numero_cuenta: datosDescifrados.cuenta_bancaria,
      titular_cuenta: datosDescifrados.titular_banco,
      banco: datosDescifrados.nombre_banco,
      nif_cif: datosDescifrados.nif_cif,
    };

    return {
      user: authData.user,
      session: authData.session,
      desarrollador: desarrolladorConDatosDescifrados,
      emailVerificationPending: true,
      mensaje:
        'Registro exitoso. Por favor, verifica tu correo electrónico para activar tu cuenta.',
    };
  },

  /**
   * Inicio de sesión de desarrollador (RF-002)
   * Valida credenciales, verifica rol de desarrollador y gestiona sesión robusta (C15)
   * Con logging de auditoría (RNF-008)
   */
  async iniciarSesion(email, password, requestMetadata = {}) {
    const emailSanitizado = sanitizeEmail(email);

    // 1. Autenticar con Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: emailSanitizado,
        password,
      });

    if (authError) {
      // Registrar intento de login fallido (RNF-008)
      await auditService.registrarLoginFallido(
        emailSanitizado,
        `Error de autenticación: ${authError.message}`,
        requestMetadata.ip_address,
        requestMetadata.user_agent,
      );
      throw authError;
    }

    // Verificar que el email esté confirmado (Seguridad)
    if (!authData.user?.email_confirmed_at) {
      // Registrar intento de login con email no verificado
      await auditService.registrarLoginFallido(
        emailSanitizado,
        'Intento de login con email no verificado',
        requestMetadata.ip_address,
        requestMetadata.user_agent,
      );

      // Cerrar la sesión creada
      await supabase.auth.signOut();

      const error = new Error('EMAIL_NOT_VERIFIED');
      error.code = 'EMAIL_NOT_VERIFIED';
      throw error;
    }

    const userId = authData.user?.id;

    // 2. Verificar que existe en tabla desarrolladores y obtener datos (usando supabaseAdmin)
    const { data: desarrollador, error: devError } = await supabaseAdmin
      .from('desarrolladores')
      .select('*')
      .eq('id', userId)
      .eq('cuenta_activa', true)
      .single();

    if (devError || !desarrollador) {
      // Si no es desarrollador, cerrar sesión
      await supabase.auth.signOut();

      // Registrar acceso no autorizado
      await auditService.registrarAccesoNoAutorizado(
        userId,
        `desarrollador:${userId}`,
        requestMetadata.ip_address,
        requestMetadata.user_agent,
        `Usuario no registrado como desarrollador o cuenta inactiva - Email: ${emailSanitizado}`,
      );

      throw new Error(
        'Acceso denegado: Usuario no registrado como desarrollador',
      );
    }

    // 3. Crear sesión robusta en tabla sesiones_desarrolladores (C15)
    try {
      await sessionService.crearSesion({
        desarrolladorId: userId,
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        ipAddress: requestMetadata.ip_address,
        userAgent: requestMetadata.user_agent,
        mfaHabilitado: desarrollador.mfa_habilitado,
      });
    } catch (sessionError) {
      console.error('Error al crear sesión en BD:', sessionError);
      // No lanzar error, la sesión de Supabase existe
      await auditService.registrarEvento({
        desarrolladorId: userId,
        accion: ACCIONES_AUDITORIA.LOGIN,
        resultado: RESULTADOS.FALLIDO,
        detalles: {
          razon: `Error al registrar sesión en BD: ${sessionError.message}`,
          email: emailSanitizado,
        },
        ipAddress: requestMetadata.ip_address,
        userAgent: requestMetadata.user_agent,
      });
    }

    // 4. Actualizar última sesión
    await supabaseAdmin
      .from('desarrolladores')
      .update({ ultima_sesion: new Date().toISOString() })
      .eq('id', userId);

    // 5. Registrar login exitoso (RNF-008)
    await auditService.registrarLogin(
      userId,
      requestMetadata.ip_address,
      requestMetadata.user_agent,
      { email: emailSanitizado },
    );


    const datosDescifrados = decryptBankData({
      cuenta_bancaria: desarrollador.numero_cuenta,
      titular_banco: desarrollador.titular_cuenta,
      nombre_banco: desarrollador.banco,
      nif_cif: desarrollador.nif_cif
    });

    const desarrolladorConDatosDescifrados = {
      ...desarrollador,
      numero_cuenta: datosDescifrados.cuenta_bancaria,
      titular_cuenta: datosDescifrados.titular_banco,
      banco: datosDescifrados.nombre_banco,
      nif_cif: datosDescifrados.nif_cif
    };

    return {
      user: authData.user,
      session: authData.session,
      desarrollador: desarrolladorConDatosDescifrados,
      mfaRequired:
        desarrollador.mfa_habilitado && !authData.session.mfa_verified,
    };
  },

  /**
   * Reenviar correo de verificación de email
   * Permite que desarrolladores que no recibieron el correo inicial lo soliciten nuevamente
   */
  async reenviarCorreoVerificacion(email, requestMetadata = {}) {
    const emailSanitizado = sanitizeEmail(email);

    // Validar email
    if (!isValidEmail(emailSanitizado)) {
      throw new Error('Formato de email inválido');
    }

    // Reenviar correo de verificación
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: emailSanitizado,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/desarrollador/login?verified=true`,
      },
    });

    if (error) {
      // Registrar error
      await auditService.registrarEvento({
        desarrolladorId: null,
        accion: ACCIONES_AUDITORIA.REENVIO_VERIFICACION,
        resultado: RESULTADOS.FALLIDO,
        detalles: {
          razon: `Error al reenviar correo: ${error.message}`,
          email: emailSanitizado,
        },
        ipAddress: requestMetadata.ip_address,
        userAgent: requestMetadata.user_agent,
      });
      throw error;
    }

    // Registrar reenvío exitoso
    await auditService.registrarEvento({
      desarrolladorId: null,
      accion: ACCIONES_AUDITORIA.REENVIO_VERIFICACION,
      resultado: RESULTADOS.EXITOSO,
      detalles: { email: emailSanitizado },
      ipAddress: requestMetadata.ip_address,
      userAgent: requestMetadata.user_agent,
    });

    return {
      success: true,
      mensaje: 'Correo de verificación reenviado exitosamente',
    };
  },

  /**
   * Cerrar sesión de desarrollador
   * Con invalidación de sesión en BD (C15) y logging (RNF-008)
   */
  async cerrarSesion(userId, requestMetadata = {}) {
    // 1. Invalidar sesión en tabla sesiones_desarrolladores
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        // Primero buscar la sesión por token hash para obtener el session ID
        const sesionActiva = await sessionService.validarSesion(
          session.access_token,
        );
        if (sesionActiva) {
          await sessionService.invalidarSesion(sesionActiva.id, 'logout');
        }
      }
    } catch (sessionError) {
      console.error('Error al invalidar sesión en BD:', sessionError);
    }

    // 2. Cerrar sesión en Supabase Auth
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // 3. Registrar logout (RNF-008)
    if (userId) {
      await auditService.registrarLogout(
        userId,
        requestMetadata.ip_address,
        requestMetadata.user_agent,
      );
    }
  },

  /**
   * Obtener desarrollador actual autenticado
   */
  async obtenerDesarrolladorActual() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('No hay sesión activa');
    }

    const { data: desarrollador, error: devError } = await supabaseAdmin
      .from('desarrolladores')
      .select('*')
      .eq('id', user.id)
      .eq('cuenta_activa', true)
      .single();

    if (devError || !desarrollador) {
      throw new Error('Desarrollador no encontrado');
    }

    // Descifrar datos bancarios
    const datosDescifrados = decryptBankData({
      cuenta_bancaria: desarrollador.numero_cuenta,
      titular_banco: desarrollador.titular_cuenta,
      nombre_banco: desarrollador.banco,
      nif_cif: desarrollador.nif_cif,
    });

    const desarrolladorConDatosDescifrados = {
      ...desarrollador,
      numero_cuenta: datosDescifrados.cuenta_bancaria,
      titular_cuenta: datosDescifrados.titular_banco,
      banco: datosDescifrados.nombre_banco,
      nif_cif: datosDescifrados.nif_cif,
    };

    return {
      user,
      desarrollador: desarrolladorConDatosDescifrados,
    };
  },

  /**
   * Obtener sesión actual
   */
  async obtenerSesion() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  /**
   * Solicitar restablecimiento de contraseña
   */
  async solicitarRestablecimientoPassword(email) {
    // Enviar email de reset (Supabase maneja la validación del email)
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/steamworks/reset-password`,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Actualizar contraseña con tokens
   */
  async actualizarPassword(nuevaPassword, accessToken, refreshToken) {
    // Establecer sesión con tokens
    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) throw sessionError;
    }

    // Actualizar contraseña
    const { data, error } = await supabase.auth.updateUser({
      password: nuevaPassword,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Verificar si un usuario es desarrollador válido
   */
  async verificarRolDesarrollador(userId) {
    const { data, error } = await supabaseAdmin
      .from('desarrolladores')
      .select('id, rol, cuenta_activa, mfa_habilitado')
      .eq('id', userId)
      .eq('cuenta_activa', true)
      .single();

    if (error || !data) {
      return { esDesarrollador: false, desarrollador: null };
    }

    return {
      esDesarrollador: true,
      desarrollador: data,
    };
  },
};
