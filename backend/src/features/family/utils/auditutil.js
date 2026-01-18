import { supabaseAdmin } from '../../../shared/config/supabase.js';

export const logAudit = async (familyId, userId, actionType, actionDetails = {}, req = null) => {
  try {
    await supabaseAdmin.from('family_audit_logs').insert([{
      family_id: familyId,
      user_id: userId,
      action_type: actionType,
      action_details: actionDetails,
      ip_address: req?.ip ?? null,
      user_agent: req?.headers?.['user-agent'] ?? null
    }]);
  } catch {
    // no rompas la app por auditoría
  }
};
