import { FamilyService } from '../services/familyservice.js';
import { InvitationService } from '../services/invitationservice.js';
import { GameLockService } from '../services/gameLockservice.js';

export const FamilyController = {
  async create(req, res) {
    try {
      const { familyName } = req.body;
      const fam = await FamilyService.createFamily(req.user.id, familyName, req);
      res.status(201).json({ success: true, data: fam });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  },

  async myFamily(req, res) {
    try {
      const fam = await FamilyService.getFamilyByOwner(req.user.id);
      if (!fam) return res.status(404).json({ success: false, error: 'No tienes familia' });
      res.json({ success: true, data: fam });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  },

  async invite(req, res) {
    try {
      const fam = await FamilyService.getFamilyByOwner(req.user.id);
      if (!fam) return res.status(404).json({ success: false, error: 'No tienes familia' });

      const { invitedEmail } = req.body;
      const inv = await InvitationService.createInvitation(fam.id, invitedEmail, req.user.id, req);
      res.status(201).json({ success: true, data: inv });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  },

  async accept(req, res) {
    try {
      const { token, pinCode } = req.body;

      const inv = await InvitationService.validateAndConsume(token, req.user.email, pinCode);
      await FamilyService.addMember(inv.family_id, req.user.id, req);
      await InvitationService.markAccepted(inv.id, req.user.id);

      res.json({ success: true, message: 'Unido a la familia', familyId: inv.family_id });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  },

  async lockGame(req, res) {
    try {
      const fam = await FamilyService.getFamilyByOwner(req.user.id);
      if (!fam) return res.status(404).json({ success: false, error: 'No tienes familia' });

      const { gameId } = req.body;
      const r = await GameLockService.lock(fam.id, gameId, req.user.id);

      if (!r.ok) return res.status(409).json({ success: false, error: 'Juego en uso', data: r });
      res.json({ success: true, data: r });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  },

  async unlockGame(req, res) {
    try {
      const fam = await FamilyService.getFamilyByOwner(req.user.id);
      if (!fam) return res.status(404).json({ success: false, error: 'No tienes familia' });

      const { gameId } = req.body;
      await GameLockService.unlock(fam.id, gameId, req.user.id);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  }
};
