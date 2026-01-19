import { jest } from '@jest/globals';

const createBuilder = (response = { data: null, error: null, count: null }) => {
  const builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    gte: jest.fn(() => builder),
    order: jest.fn(() => builder),
    range: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    single: jest.fn(async () => response),
    maybeSingle: jest.fn(async () => response),
    then: (resolve, reject) => Promise.resolve(response).then(resolve, reject)
  };
  return builder;
};

const supabaseMock = {
  from: jest.fn(),
  rpc: jest.fn()
};

const limitedAccountServiceMock = {
  unlockAccountIfEligible: jest.fn(async () => ({ justUnlocked: false }))
};

jest.unstable_mockModule('../../../shared/config/supabase.js', () => ({
  supabaseAdmin: supabaseMock,
  default: supabaseMock
}));

jest.unstable_mockModule('../../../shared/services/limitedAccountService.js', () => ({
  limitedAccountService: limitedAccountServiceMock
}));

const { walletService } = await import('../services/walletService.js');

describe('walletService', () => {
  beforeEach(() => {
    supabaseMock.from.mockReset();
    supabaseMock.rpc.mockReset();
    walletService._recentOperations.clear();
  });

  test('processPayment requiere idempotency key', async () => {
    await expect(walletService.processPayment('user', 5, 'Compra'))
      .rejects
      .toThrow('Se requiere un identificador único para el pago');
  });

  test('processPayment valida monto mínimo', async () => {
    await expect(walletService.processPayment('user', 0, 'Compra', null, null, 'key-0'))
      .rejects
      .toThrow('El monto de compra no es válido');
  });

  test('processPayment rechaza pagos ya completados', async () => {
    jest.useFakeTimers();

    const txBuilder = createBuilder({
      data: { id: 'tx-1', status: 'completed' },
      error: null
    });

    supabaseMock.from.mockImplementationOnce(() => txBuilder);

    await expect(walletService.processPayment('user', 5, 'Compra', null, null, 'key-1'))
      .rejects
      .toThrow('Este pago ya fue procesado anteriormente');

    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('processPayment usa fallback cuando la RPC no existe', async () => {
    jest.useFakeTimers();

    supabaseMock.from
      .mockImplementationOnce(() => createBuilder({ data: null, error: null }))
      .mockImplementationOnce(() => createBuilder({ data: { balance: 10 }, error: null }))
      .mockImplementationOnce(() => createBuilder({ data: { id: 'tx-1' }, error: null }))
      .mockImplementationOnce(() => createBuilder({ data: { balance: 5 }, error: null }))
      .mockImplementationOnce(() => createBuilder({ data: null, error: null }));

    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: { code: 'PGRST202', message: 'not find' }
    });

    const result = await walletService.processPayment('user', 5, 'Compra', 'item', 'i-1', 'key-fb');

    expect(result).toEqual({ success: true, newBalance: 5, transactionId: 'tx-1' });

    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('processPayment retorna datos de RPC', async () => {
    jest.useFakeTimers();

    supabaseMock.from.mockImplementationOnce(() => createBuilder({ data: null, error: null }));

    supabaseMock.rpc.mockResolvedValue({
      data: { new_balance: 9, transaction_id: 'tx-9' },
      error: null
    });

    const result = await walletService.processPayment('user', 1, 'Compra', null, null, 'key-ok');

    expect(result).toEqual({ success: true, newBalance: 9, transactionId: 'tx-9' });

    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('getBalance retorna balance actual', async () => {
    const builder = createBuilder({ data: { balance: 7 }, error: null });
    supabaseMock.from.mockImplementationOnce(() => builder);

    const balance = await walletService.getBalance('user');

    expect(balance).toBe(7);
  });

  test('getBalance lanza error en fallo', async () => {
    const builder = createBuilder({ data: null, error: new Error('fail') });
    supabaseMock.from.mockImplementationOnce(() => builder);

    await expect(walletService.getBalance('user'))
      .rejects
      .toThrow('Error al obtener el balance');
  });

  test('reloadWallet bloquea doble click durante cooldown', async () => {
    jest.useFakeTimers();

    supabaseMock.from.mockImplementationOnce(() => createBuilder({ data: null, error: null }));

    const limitSpy = jest
      .spyOn(walletService, 'getDailyReloadTotal')
      .mockResolvedValue(0);

    supabaseMock.rpc.mockResolvedValue({
      data: { new_balance: 20, transaction_id: 'tx-1' },
      error: null
    });

    await walletService.reloadWallet('user', 10, 'key-1');

    await expect(walletService.reloadWallet('user', 10, 'key-2'))
      .rejects
      .toThrow('Operación en proceso. Espera unos segundos antes de intentar de nuevo.');

    limitSpy.mockRestore();

    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('reloadWallet valida monto con decimales inválidos', async () => {
    jest.useFakeTimers();

    await expect(walletService.reloadWallet('user', 10.999, 'key-dec'))
      .rejects
      .toThrow('El monto debe tener máximo 2 decimales');

    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('reloadWallet valida el límite diario antes de recargar', async () => {
    jest.useFakeTimers();

    supabaseMock.from.mockImplementationOnce(() => createBuilder({ data: null, error: null }));

    const limitSpy = jest
      .spyOn(walletService, 'getDailyReloadTotal')
      .mockResolvedValue(walletService.LIMITS.MAX_DAILY_RELOAD - 1);

    await expect(walletService.reloadWallet('user', 10, 'key-3'))
      .rejects
      .toThrow('Has alcanzado el límite diario de recarga');

    limitSpy.mockRestore();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('reloadWallet detecta transacción ya procesada', async () => {
    jest.useFakeTimers();

    supabaseMock.from.mockImplementationOnce(() => createBuilder({
      data: { id: 'tx-1', status: 'completed' },
      error: null
    }));

    const limitSpy = jest
      .spyOn(walletService, 'getDailyReloadTotal')
      .mockResolvedValue(0);

    await expect(walletService.reloadWallet('user', 10, 'key-dup'))
      .rejects
      .toThrow('Esta transacción ya fue procesada');

    limitSpy.mockRestore();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('reloadWallet usa fallback cuando la RPC no existe', async () => {
    jest.useFakeTimers();

    supabaseMock.from
      .mockImplementationOnce(() => createBuilder({ data: null, error: null }))
      .mockImplementationOnce(() => createBuilder({ data: { balance: 5 }, error: null }))
      .mockImplementationOnce(() => createBuilder({ data: { id: 'tx-1' }, error: null }))
      .mockImplementationOnce(() => createBuilder({ data: { balance: 15 }, error: null }))
      .mockImplementationOnce(() => createBuilder({ data: null, error: null }));

    const limitSpy = jest
      .spyOn(walletService, 'getDailyReloadTotal')
      .mockResolvedValue(0);

    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: { code: 'PGRST202', message: 'not find' }
    });

    const result = await walletService.reloadWallet('user', 10, 'key-fb');

    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(15);

    limitSpy.mockRestore();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('getDailyReloadTotal devuelve 0 en error', async () => {
    const builder = createBuilder({ data: null, error: new Error('fail') });
    supabaseMock.from.mockImplementationOnce(() => builder);

    const total = await walletService.getDailyReloadTotal('user');

    expect(total).toBe(0);
  });

  test('getTransactionHistory devuelve lista', async () => {
    const builder = createBuilder({
      data: [{ id: 'tx-1' }],
      error: null
    });
    supabaseMock.from.mockImplementationOnce(() => builder);

    const result = await walletService.getTransactionHistory('user', 10, 0);

    expect(result).toEqual([{ id: 'tx-1' }]);
  });

  test('getTransactionHistory lanza error en fallo', async () => {
    const builder = createBuilder({ data: null, error: new Error('fail') });
    supabaseMock.from.mockImplementationOnce(() => builder);

    await expect(walletService.getTransactionHistory('user'))
      .rejects
      .toThrow('Error al obtener historial de transacciones');
  });
});
