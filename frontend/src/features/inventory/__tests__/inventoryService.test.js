import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { inventoryService } from '../services/inventoryService.js';

describe('inventoryService (frontend)', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('getInventory retorna items', async () => {
    global.fetch.mockResolvedValue({
      json: async () => ({ success: true, data: [{ id: 'i1' }] })
    });

    const result = await inventoryService.getInventory('user');
    expect(result).toEqual([{ id: 'i1' }]);
  });

  test('getInventory lanza error si falla', async () => {
    global.fetch.mockResolvedValue({
      json: async () => ({ success: false, message: 'fail' })
    });

    await expect(inventoryService.getInventory('user')).rejects.toThrow('fail');
  });

  test('getMarketListings retorna lista vacía cuando falla', async () => {
    global.fetch.mockResolvedValue({
      json: async () => ({ success: false })
    });

    const result = await inventoryService.getMarketListings();
    expect(result).toEqual({ success: false, listings: [] });
  });

  test('getDailyPurchaseStatus retorna defaults en error', async () => {
    global.fetch.mockResolvedValue({
      json: async () => ({ success: false })
    });

    const result = await inventoryService.getDailyPurchaseStatus();
    expect(result).toEqual({ dailyTotal: 0, dailyLimit: 2000, remaining: 2000, limitReached: false });
  });

  test('purchaseItem agrega statusCode en error', async () => {
    global.fetch.mockResolvedValue({
      status: 409,
      json: async () => ({ success: false, message: 'no' })
    });

    await expect(inventoryService.purchaseItem('l1'))
      .rejects
      .toMatchObject({ message: 'no', statusCode: 409 });
  });
});
