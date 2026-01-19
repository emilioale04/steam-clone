import { supabaseAdmin } from '../../../shared/config/supabase.js';
import { generatePIN } from '../utils/tokenutil.js';
import { logAudit } from '../utils/auditutil.js';

export const FamilyService = {
  async createFamily(ownerId, familyName = 'Mi Familia', req = null) {
    const pin = generatePIN();

    const { data: family, error } = await supabaseAdmin
      .from('families')
      .insert([{ owner_id: ownerId, family_name: familyName, pin_code: pin, max_members: 6 }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    // dueño como miembro
    await supabaseAdmin.from('family_members').insert([{
      family_id: family.id,
      user_id: ownerId,
      role: 'owner'
    }]);

    await logAudit(family.id, ownerId, 'FAMILY_CREATED', { familyName }, req);
    return { ...family, pin_code: pin };
  },

  async getFamilyByOwner(ownerId) {
    const { data, error } = await supabaseAdmin
      .from('families')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  },

  async countMembers(familyId) {
    const { count, error } = await supabaseAdmin
      .from('family_members')
      .select('*', { count: 'exact', head: true })
      .eq('family_id', familyId);

    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async addMember(familyId, userId, req = null) {
    // límite 6
    const { data: fam, error: famErr } = await supabaseAdmin
      .from('families')
      .select('max_members')
      .eq('id', familyId)
      .single();
    if (famErr) throw new Error(famErr.message);

    const current = await this.countMembers(familyId);
    if (current >= fam.max_members) throw new Error('Límite de miembros alcanzado (6)');

    // insertar
    const { data, error } = await supabaseAdmin
      .from('family_members')
      .insert([{ family_id: familyId, user_id: userId, role: 'member' }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    await logAudit(familyId, userId, 'MEMBER_ADDED', {}, req);
    return data;
  }
};
