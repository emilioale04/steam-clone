import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { walletService } from '../services/walletService.js';

describe('walletService (frontend)', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('getBalance retorna balance', async () => {
    global.fetch.mockResolvedValue({
      json: async () => ({ success: true, data: { balance: 12 } })
    });

    const balance = await walletService.getBalance();
    expect(balance).toBe(12);
  });

  test('getBalance lanza error cuando falla', async () => {
    global.fetch.mockResolvedValue({
      json: async () => ({ success: false, message: 'fail' })
    });

    await expect(walletService.getBalance()).rejects.toThrow('fail');
  });

  test('reloadWallet retorna datos mapeados', async () => {
    global.fetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: { newBalance: 20, transactionId: 'tx-1', accountUnlocked: true, unlockMessage: 'ok' }
      })
    });

    const result = await walletService.reloadWallet(10);
    expect(result).toEqual({
      newBalance: 20,
      transactionId: 'tx-1',
      accountUnlocked: true,
      unlockMessage: 'ok'
    });
  });

  test('processPayment lanza error en respuesta fallida', async () => {
    global.fetch.mockResolvedValue({
      json: async () => ({ success: false, message: 'no' })
    });

    await expect(walletService.processPayment(2, 'x')).rejects.toThrow('no');
  });

  test('getTransactionHistory devuelve transacciones', async () => {
    global.fetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: { transactions: [{ id: 't1' }], pagination: { total: 1 } }
      })
    });

    const result = await walletService.getTransactionHistory(10, 0);
    expect(result).toEqual({ transactions: [{ id: 't1' }], pagination: { total: 1 } });
  });
});
