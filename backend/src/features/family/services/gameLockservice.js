import { supabaseAdmin } from '../../../shared/config/supabase.js';

const GAME_LOCK_MIN = Number(process.env.GAME_LOCK_MINUTES || 15);

export const GameLockService = {
  async lock(familyId, gameId, userId) {
    // si existe lock activo, rechaza (si es otro usuario)
    const { data: existing } = await supabaseAdmin
      .from('game_locks')
      .select('*')
      .eq('family_id', familyId)
      .eq('game_id', gameId)
      .gt('expires_at', new Date())
      .maybeSingle();

    if (existing && existing.locked_by !== userId) return { ok: false, lockedBy: existing.locked_by };

    const expires = new Date(Date.now() + GAME_LOCK_MIN * 60 * 1000);

    // upsert simple (borra lock viejo si era del mismo user)
    await supabaseAdmin.from('game_locks')
      .delete()
      .eq('family_id', familyId)
      .eq('game_id', gameId)
      .eq('locked_by', userId);

    const { error } = await supabaseAdmin.from('game_locks').insert([{
      family_id: familyId,
      game_id: gameId,
      locked_by: userId,
      expires_at: expires
    }]);

    if (error) throw new Error(error.message);
    return { ok: true, expires_at: expires };
  },

  async unlock(familyId, gameId, userId) {
    await supabaseAdmin.from('game_locks')
      .delete()
      .eq('family_id', familyId)
      .eq('game_id', gameId)
      .eq('locked_by', userId);
  }
};
