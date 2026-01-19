import { supabaseAdmin } from '../../../shared/config/supabase.js';
import { generateInvitationToken, getExpirationDate, isExpired } from '../utils/tokenutil.js';
import { logAudit } from '../utils/auditutil.js';

const MAX_FAILED = Number(process.env.MAX_FAILED_ATTEMPTS || 3);
const LOCK_MIN = Number(process.env.LOCKOUT_TIME_MINUTES || 15);

export const InvitationService = {
  async createInvitation(familyId, invitedEmail, invitedBy, req = null) {
    const token = generateInvitationToken();
    const expiresAt = getExpirationDate();

    const { data, error } = await supabaseAdmin
      .from('family_invitations')
      .insert([{
        family_id: familyId,
        token,
        invited_email: invitedEmail,
        invited_by: invitedBy,
        expires_at: expiresAt,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    await logAudit(familyId, invitedBy, 'INVITATION_CREATED', { invitedEmail, expiresAt }, req);

    return {
      ...data,
      inviteLink: `${process.env.FRONTEND_URL}/family/join?token=${token}`
    };
  },

  async getByToken(token) {
    const { data, error } = await supabaseAdmin
      .from('family_invitations')
      .select('*, families:family_id(id, pin_code, max_members)')
      .eq('token', token)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Token inválido');
    return data;
  },

  async failAttempt(invitationId) {
    // usa RPC (sin raw)
    const { data, error } = await supabaseAdmin.rpc('fs_invitation_fail', {
      p_invitation_id: invitationId,
      p_max_attempts: MAX_FAILED,
      p_lock_minutes: LOCK_MIN
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async validateAndConsume(token, email, pinCode) {
    const inv = await this.getByToken(token);

    if (inv.status !== 'pending') throw new Error('Invitación ya usada/cancelada');
    if (isExpired(inv.expires_at)) {
      await supabaseAdmin.from('family_invitations')
        .update({ status: 'expired' })
        .eq('id', inv.id);
      throw new Error('Invitación expirada (4 minutos)');
    }

    if (inv.is_locked && inv.locked_until && new Date(inv.locked_until) > new Date()) {
      throw new Error('Bloqueado por intentos fallidos. Intenta más tarde.');
    }

    if (inv.invited_email.toLowerCase() !== email.toLowerCase()) {
      const updated = await this.failAttempt(inv.id);
      if (updated.is_locked) throw new Error('Bloqueado por 3 intentos fallidos');
      throw new Error('Email no coincide');
    }

    if (inv.families.pin_code !== pinCode) {
      const updated = await this.failAttempt(inv.id);
      if (updated.is_locked) throw new Error('Bloqueado por 3 intentos fallidos');
      throw new Error('PIN incorrecto');
    }

    // reset intentos + aceptar
    const { data: updated, error } = await supabaseAdmin
      .from('family_invitations')
      .update({
        failed_attempts: 0,
        is_locked: false,
        locked_until: null
      })
      .eq('id', inv.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated;
  },

  async markAccepted(invitationId, userId) {
    const { data, error } = await supabaseAdmin
      .from('family_invitations')
      .update({
        status: 'accepted',
        accepted_by: userId,
        accepted_at: new Date()
      })
      .eq('id', invitationId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
};
