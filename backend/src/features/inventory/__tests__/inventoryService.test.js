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

jest.unstable_mockModule('../../../shared/config/supabase.js', () => ({
  supabaseAdmin: supabaseMock,
  default: supabaseMock
}));

const { inventoryService } = await import('../services/inventoryService.js');
const { privacyService } = await import('../services/privacyService.js');

describe('inventoryService', () => {
  beforeEach(() => {
    supabaseMock.from.mockReset();
    supabaseMock.rpc.mockReset();
  });

  test('getUserInventory lanza error si no hay permiso', async () => {
    jest.spyOn(privacyService, 'canViewInventory').mockResolvedValue(false);

    await expect(inventoryService.getUserInventory('viewer', 'owner'))
      .rejects
      .toThrow('No tienes permiso para ver este inventario');
  });

  test('getItemById lanza error si no existe', async () => {
    const itemBuilder = createBuilder({ data: null, error: null });
    supabaseMock.from.mockImplementationOnce(() => itemBuilder);

    await expect(inventoryService.getItemById('item-1', 'viewer'))
      .rejects
      .toThrow('Item no encontrado');
  });

  test('getItemById respeta privacidad', async () => {
    const itemBuilder = createBuilder({
      data: { id: 'item-1', owner_id: 'owner' },
      error: null
    });
    supabaseMock.from.mockImplementationOnce(() => itemBuilder);

    jest.spyOn(privacyService, 'canViewInventory').mockResolvedValue(false);

    await expect(inventoryService.getItemById('item-1', 'viewer'))
      .rejects
      .toThrow('No tienes permiso para ver este item');
  });

  test('getUserInventory mapea listings y trades activos', async () => {
    jest.spyOn(privacyService, 'canViewInventory').mockResolvedValue(true);

    const itemsBuilder = createBuilder({
      data: [
        {
          id: 'item-1',
          owner_id: 'owner',
          marketplace_listings: [
            { id: 'l-1', price: 10, status: 'Active' },
            { id: 'l-2', price: 9, status: 'Inactive' }
          ]
        }
      ],
      error: null
    });
    const tradesBuilder = createBuilder({
      data: [{ id: 't-1', item_id: 'item-1', status: 'Pendiente' }],
      error: null
    });
    const offersBuilder = createBuilder({
      data: [{ id: 'o-1', item_id: 'item-1', trade_id: 't-1', status: 'Pendiente' }],
      error: null
    });

    supabaseMock.from
      .mockImplementationOnce(() => itemsBuilder)
      .mockImplementationOnce(() => tradesBuilder)
      .mockImplementationOnce(() => offersBuilder);

    const result = await inventoryService.getUserInventory('viewer', 'owner');

    expect(result).toHaveLength(1);
    expect(result[0].active_listing).toEqual({ id: 'l-1', price: 10, status: 'Active' });
    expect(result[0].active_trade).toEqual({ id: 't-1', item_id: 'item-1', status: 'Pendiente' });
    expect(result[0].active_trade_offer).toEqual({ id: 'o-1', item_id: 'item-1', trade_id: 't-1', status: 'Pendiente' });
  });

  test('updateListingPrice bloquea si el listing no pertenece al usuario', async () => {
    const listingBuilder = createBuilder({
      data: { id: 'l-1', seller_id: 'other', status: 'Active', price: 10 },
      error: null
    });

    supabaseMock.from.mockImplementationOnce(() => listingBuilder);

    await expect(inventoryService.updateListingPrice('user', 'l-1', 12))
      .rejects
      .toThrow('Esta publicación no te pertenece');
  });

  test('updateListingPrice no actualiza si el precio no cambia', async () => {
    const listingBuilder = createBuilder({
      data: { id: 'l-1', seller_id: 'user', status: 'Active', price: 10 },
      error: null
    });

    supabaseMock.from.mockImplementationOnce(() => listingBuilder);

    const result = await inventoryService.updateListingPrice('user', 'l-1', 10);

    expect(result.unchanged).toBe(true);
    expect(listingBuilder.update).not.toHaveBeenCalled();
  });

  test('updateListingPrice valida estado activo', async () => {
    const listingBuilder = createBuilder({
      data: { id: 'l-1', seller_id: 'user', status: 'Inactive', price: 10 },
      error: null
    });

    supabaseMock.from.mockImplementationOnce(() => listingBuilder);

    await expect(inventoryService.updateListingPrice('user', 'l-1', 12))
      .rejects
      .toThrow('Esta publicación ya no está activa');
  });

  test('syncWithSteam inserta solo items nuevos', async () => {
    const currentBuilder = createBuilder({
      data: [{ steam_item_id: 'a' }],
      error: null
    });
    const insertBuilder = createBuilder({ data: null, error: null });

    supabaseMock.from
      .mockImplementationOnce(() => currentBuilder)
      .mockImplementationOnce(() => insertBuilder);

    const result = await inventoryService.syncWithSteam('user', [
      { steam_item_id: 'a', is_tradeable: true, is_marketable: true },
      { steam_item_id: 'b', is_tradeable: false, is_marketable: true }
    ]);

    expect(insertBuilder.insert).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true, syncedCount: 1 });
  });

  test('syncWithSteam no inserta si no hay nuevos', async () => {
    const currentBuilder = createBuilder({
      data: [{ steam_item_id: 'a' }],
      error: null
    });

    supabaseMock.from.mockImplementationOnce(() => currentBuilder);

    const result = await inventoryService.syncWithSteam('user', [
      { steam_item_id: 'a', is_tradeable: true, is_marketable: true }
    ]);

    expect(result).toEqual({ success: true, syncedCount: 0 });
  });

  test('getDailyPurchaseTotal suma montos absolutos', async () => {
    const txBuilder = createBuilder({
      data: [{ amount: -5 }, { amount: -3 }],
      error: null
    });

    supabaseMock.from.mockImplementationOnce(() => txBuilder);

    const total = await inventoryService.getDailyPurchaseTotal('user');

    expect(total).toBe(8);
  });

  test('getDailyPurchaseTotal devuelve 0 en error', async () => {
    const txBuilder = createBuilder({
      data: null,
      error: new Error('fail')
    });

    supabaseMock.from.mockImplementationOnce(() => txBuilder);

    const total = await inventoryService.getDailyPurchaseTotal('user');

    expect(total).toBe(0);
  });

  test('purchaseMarketplaceItem mapea error de disponibilidad', async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: { message: 'ya no está disponible' }
    });

    await expect(inventoryService.purchaseMarketplaceItem('buyer', 'listing'))
      .rejects
      .toThrow('Este artículo ya fue vendido o retirado del mercado');
  });

  test('purchaseMarketplaceItem requiere datos completos', async () => {
    await expect(inventoryService.purchaseMarketplaceItem(null, 'listing'))
      .rejects
      .toThrow('Datos de compra incompletos');
  });

  test('purchaseMarketplaceItem mapea error de fondos', async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Fondos insuficientes' }
    });

    await expect(inventoryService.purchaseMarketplaceItem('buyer', 'listing'))
      .rejects
      .toThrow('Fondos insuficientes');
  });

  test('purchaseMarketplaceItem retorna datos mapeados', async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: {
        message: 'ok',
        item_name: 'Item',
        price_paid: 5,
        buyer_new_balance: 15,
        buyer_transaction_id: 'tx-1',
        seller_receives: 4,
        commission: 1
      },
      error: null
    });

    const result = await inventoryService.purchaseMarketplaceItem('buyer', 'listing');

    expect(result).toEqual({
      success: true,
      message: 'ok',
      itemName: 'Item',
      pricePaid: 5,
      newBalance: 15,
      transactionId: 'tx-1',
      sellerReceived: 4,
      commission: 1
    });
  });

  test('countActiveListings lanza error en fallo DB', async () => {
    const builder = createBuilder({
      data: null,
      count: null,
      error: { message: 'db' }
    });

    supabaseMock.from.mockImplementationOnce(() => builder);

    await expect(inventoryService.countActiveListings('user'))
      .rejects
      .toThrow('db');
  });

  test('countActiveListings devuelve conteo', async () => {
    const builder = createBuilder({
      data: null,
      count: 3,
      error: null
    });

    supabaseMock.from.mockImplementationOnce(() => builder);

    const count = await inventoryService.countActiveListings('user');

    expect(count).toBe(3);
  });

  test('listForSale mapea resultado de RPC', async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: {
        id: 'l-1',
        price: 10,
        listing_date: '2024-01-01',
        name: 'Item',
        seller_id: 'user'
      },
      error: null
    });

    const result = await inventoryService.listForSale('user', 'item', 10);

    expect(result).toEqual({
      id: 'l-1',
      price: 10,
      listing_price: 10,
      listing_date: '2024-01-01',
      created_at: '2024-01-01',
      name: 'Item',
      seller_id: 'user'
    });
  });

  test('cancelListing lanza error si falla RPC', async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: { message: 'fail' }
    });

    await expect(inventoryService.cancelListing('user', 'listing'))
      .rejects
      .toThrow('fail');
  });

  test('updateListingPrice actualiza precio', async () => {
    const listingBuilder = createBuilder({
      data: { id: 'l-1', seller_id: 'user', status: 'Active', price: 10 },
      error: null
    });
    const updateBuilder = createBuilder({
      data: { id: 'l-1', price: 12, updated_at: '2024-01-01' },
      error: null
    });

    supabaseMock.from
      .mockImplementationOnce(() => listingBuilder)
      .mockImplementationOnce(() => updateBuilder);

    const result = await inventoryService.updateListingPrice('user', 'l-1', 12);

    expect(result).toEqual({ id: 'l-1', price: 12, updated_at: '2024-01-01' });
  });

  test('updateListingPrice lanza error si update falla', async () => {
    const listingBuilder = createBuilder({
      data: { id: 'l-1', seller_id: 'user', status: 'Active', price: 10 },
      error: null
    });
    const updateBuilder = createBuilder({
      data: null,
      error: { message: 'fail' }
    });

    supabaseMock.from
      .mockImplementationOnce(() => listingBuilder)
      .mockImplementationOnce(() => updateBuilder);

    await expect(inventoryService.updateListingPrice('user', 'l-1', 12))
      .rejects
      .toThrow('Error al actualizar el precio');
  });

  test('getMarketListings mapea datos del mercado', async () => {
    const builder = createBuilder({
      data: [
        {
          id: 'l-1',
          price: 10,
          created_at: '2024-01-01',
          seller_id: 'user',
          items: { id: 'i-1', name: 'Item', steam_item_id: 's-1', is_tradeable: true, is_marketable: true },
          profiles: { username: 'alice' }
        }
      ],
      error: null
    });

    supabaseMock.from.mockImplementationOnce(() => builder);

    const result = await inventoryService.getMarketListings();

    expect(result[0]).toEqual({
      id: 'l-1',
      itemId: 'i-1',
      steam_item_id: 's-1',
      name: 'Item',
      price: 10,
      seller: 'alice',
      seller_id: 'user',
      sellerValid: true,
      image: null,
      is_tradeable: true,
      is_marketable: true,
      listing_date: '2024-01-01'
    });
  });
});
