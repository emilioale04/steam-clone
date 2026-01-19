import { jest } from '@jest/globals';

const createBuilder = (response = { data: null, error: null }) => {
  const builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    or: jest.fn(() => builder),
    update: jest.fn(() => builder),
    single: jest.fn(async () => response),
    maybeSingle: jest.fn(async () => response),
    then: (resolve, reject) => Promise.resolve(response).then(resolve, reject)
  };
  return builder;
};

const supabaseMock = {
  from: jest.fn()
};

jest.unstable_mockModule('../../../shared/config/supabase.js', () => ({
  supabaseAdmin: supabaseMock,
  default: supabaseMock
}));

const { privacyService } = await import('../services/privacyService.js');

const VALID_UUID = '123e4567-e89b-42d3-a456-426614174000';

describe('privacyService', () => {
  beforeEach(() => {
    supabaseMock.from.mockReset();
  });

  test('isValidUUID valida formato', () => {
    expect(privacyService.isValidUUID(VALID_UUID)).toBe(true);
    expect(privacyService.isValidUUID('no-uuid')).toBe(false);
  });

  test('getPrivacySettings normaliza a minúsculas', async () => {
    const builder = createBuilder({
      data: {
        inventory_privacy: 'PUBLIC',
        trade_privacy: 'Friends',
        marketplace_privacy: 'PRIVATE'
      },
      error: null
    });

    supabaseMock.from.mockImplementationOnce(() => builder);

    const settings = await privacyService.getPrivacySettings(VALID_UUID);

    expect(settings).toEqual({
      inventory: 'public',
      trade: 'friends',
      marketplace: 'private'
    });
  });

  test('checkAccess permite acceso público', async () => {
    jest.spyOn(privacyService, 'getPrivacySettings').mockResolvedValue({
      inventory: 'public',
      trade: 'public',
      marketplace: 'public'
    });

    const result = await privacyService.checkAccess(VALID_UUID, 'viewer', 'inventory');

    expect(result).toEqual({ allowed: true });
  });

  test('checkAccess restringe privado con mensaje', async () => {
    jest.spyOn(privacyService, 'getPrivacySettings').mockResolvedValue({
      inventory: 'private',
      trade: 'private',
      marketplace: 'private'
    });

    const result = await privacyService.checkAccess(VALID_UUID, 'viewer', 'inventory');

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Este inventario es privado. El usuario ha restringido el acceso.');
  });

  test('updatePrivacySettings valida UUID', async () => {
    await expect(privacyService.updatePrivacySettings('bad', { inventory: 'public' }))
      .rejects
      .toThrow('ID de usuario inválido');
  });

  test('updatePrivacySettings rechaza cambios vacíos', async () => {
    await expect(privacyService.updatePrivacySettings(VALID_UUID, {}))
      .rejects
      .toThrow('No se proporcionaron configuraciones para actualizar');
  });

  test('updatePrivacySettings rechaza niveles inválidos', async () => {
    await expect(privacyService.updatePrivacySettings(VALID_UUID, { trade: 'nope' }))
      .rejects
      .toThrow('Nivel de privacidad de intercambios inválido');
  });

  test('updatePrivacySettings actualiza y devuelve valores', async () => {
    const builder = createBuilder({
      data: {
        inventory_privacy: 'public',
        trade_privacy: 'friends',
        marketplace_privacy: 'private'
      },
      error: null
    });

    supabaseMock.from.mockImplementationOnce(() => builder);

    const result = await privacyService.updatePrivacySettings(VALID_UUID, {
      inventory: 'public',
      trade: 'friends'
    });

    expect(result).toEqual({
      inventory: 'public',
      trade: 'friends',
      marketplace: 'private'
    });
  });

  test('checkAccess con privacidad friends requiere login', async () => {
    jest.spyOn(privacyService, 'getPrivacySettings').mockResolvedValue({
      inventory: 'friends',
      trade: 'friends',
      marketplace: 'friends'
    });

    const result = await privacyService.checkAccess(VALID_UUID, null, 'inventory');

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Debes iniciar sesión para acceder a este contenido');
  });

  test('checkAccess friends permite si son amigos', async () => {
    jest.spyOn(privacyService, 'getPrivacySettings').mockResolvedValue({
      inventory: 'friends',
      trade: 'friends',
      marketplace: 'friends'
    });
    jest.spyOn(privacyService, 'areFriends').mockResolvedValue(true);

    const result = await privacyService.checkAccess(VALID_UUID, '123e4567-e89b-42d3-a456-426614174111', 'inventory');

    expect(result).toEqual({ allowed: true });
  });

  test('checkAccess tipo inválido rechaza', async () => {
    const result = await privacyService.checkAccess(VALID_UUID, 'viewer', 'invalid');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Tipo de privacidad inválido');
  });

  test('areFriends retorna true si es el mismo usuario', async () => {
    const result = await privacyService.areFriends(VALID_UUID, VALID_UUID);
    expect(result).toBe(true);
  });

  test('areFriends retorna false en error de DB', async () => {
    const builder = createBuilder({ data: null, error: new Error('fail') });
    supabaseMock.from.mockImplementationOnce(() => builder);

    const result = await privacyService.areFriends(VALID_UUID, '123e4567-e89b-42d3-a456-426614174111');
    expect(result).toBe(false);
  });
});
