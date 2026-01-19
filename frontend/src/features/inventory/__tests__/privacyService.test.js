import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { privacyService } from '../services/privacyService.js';

describe('privacyService (frontend)', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('getPrivacySettings retorna datos', async () => {
    global.fetch.mockResolvedValue({
      json: async () => ({ success: true, data: { inventory: 'public' } })
    });

    const result = await privacyService.getPrivacySettings();
    expect(result).toEqual({ inventory: 'public' });
  });

  test('updatePrivacySettings lanza error en fallo', async () => {
    global.fetch.mockResolvedValue({
      json: async () => ({ success: false, message: 'fail' })
    });

    await expect(privacyService.updatePrivacySettings({ inventory: 'private' }))
      .rejects
      .toThrow('fail');
  });

  test('checkInventoryAccess retorna allowed', async () => {
    global.fetch.mockResolvedValue({
      json: async () => ({ success: true, data: { allowed: true } })
    });

    const result = await privacyService.checkInventoryAccess('user');
    expect(result).toEqual({ allowed: true });
  });
});
