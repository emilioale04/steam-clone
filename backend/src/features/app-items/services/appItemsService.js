import { supabaseAdmin } from '../../../shared/config/supabase.js';
import {
  auditService,
  ACCIONES_AUDITORIA,
} from '../../../shared/services/auditService.js';

const obtenerAplicacion = async (appId, desarrolladorId) => {
  const { data: aplicacion, error } = await supabaseAdmin
    .from('aplicaciones_desarrolladores')
    .select('id, nombre_juego')
    .eq('id', appId)
    .eq('desarrollador_id', desarrolladorId)
    .single();

  if (error || !aplicacion) {
    throw new Error('Aplicacion no encontrada o sin permisos');
  }

  return aplicacion;
};

export const appItemsService = {
  async listarItems(appId, desarrolladorId) {
    await obtenerAplicacion(appId, desarrolladorId);

    const { data: items, error } = await supabaseAdmin
      .from('items_aplicaciones')
      .select(
        'id, aplicacion_id, nombre, is_tradeable, is_marketable, activo, created_at, updated_at',
      )
      .eq('aplicacion_id', appId)
      .eq('desarrollador_id', desarrolladorId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[APP_ITEMS] Error al listar items:', error);
      throw new Error('Error al listar items');
    }

    return items || [];
  },

  async crearItem(appId, desarrolladorId, datosItem, requestMetadata = {}) {
    await obtenerAplicacion(appId, desarrolladorId);

    const payload = {
      aplicacion_id: appId,
      desarrollador_id: desarrolladorId,
      nombre: datosItem.nombre?.trim(),
      is_tradeable: datosItem.is_tradeable ?? true,
      is_marketable: datosItem.is_marketable ?? true,
      activo: datosItem.activo ?? true,
    };

    const { data: item, error } = await supabaseAdmin
      .from('items_aplicaciones')
      .insert(payload)
      .select(
        'id, aplicacion_id, nombre, is_tradeable, is_marketable, activo, created_at, updated_at',
      )
      .single();

    if (error) {
      console.error('[APP_ITEMS] Error al crear item:', error);
      throw new Error('Error al crear item');
    }

    await auditService.registrarEvento({
      desarrolladorId,
      accion: ACCIONES_AUDITORIA.CREAR_ITEM,
      recurso: `item:${item.id}`,
      detalles: {
        item_id: item.id,
        aplicacion_id: item.aplicacion_id,
        nombre: item.nombre,
        is_tradeable: item.is_tradeable,
        is_marketable: item.is_marketable,
        activo: item.activo,
      },
      ipAddress: requestMetadata.ip_address,
      userAgent: requestMetadata.user_agent,
    });

    return item;
  },

  async actualizarItem(itemId, desarrolladorId, datosItem) {
    const payload = {
      updated_at: new Date().toISOString(),
    };

    if (datosItem.nombre !== undefined) {
      payload.nombre = datosItem.nombre?.trim();
    }

    if (datosItem.is_tradeable !== undefined) {
      payload.is_tradeable = datosItem.is_tradeable;
    }

    if (datosItem.is_marketable !== undefined) {
      payload.is_marketable = datosItem.is_marketable;
    }

    if (datosItem.activo !== undefined) {
      payload.activo = datosItem.activo;
    }

    const { data: item, error } = await supabaseAdmin
      .from('items_aplicaciones')
      .update(payload)
      .eq('id', itemId)
      .eq('desarrollador_id', desarrolladorId)
      .is('deleted_at', null)
      .select(
        'id, aplicacion_id, nombre, is_tradeable, is_marketable, activo, created_at, updated_at',
      )
      .single();

    if (error || !item) {
      console.error('[APP_ITEMS] Error al actualizar item:', error);
      throw new Error('Item no encontrado o sin permisos');
    }

    return item;
  },

  async eliminarItem(itemId, desarrolladorId, requestMetadata = {}) {
    const now = new Date().toISOString();

    const { data: item, error } = await supabaseAdmin
      .from('items_aplicaciones')
      .update({
        activo: false,
        deleted_at: now,
        updated_at: now,
      })
      .eq('id', itemId)
      .eq('desarrollador_id', desarrolladorId)
      .is('deleted_at', null)
      .select(
        'id, aplicacion_id, nombre, is_tradeable, is_marketable, activo, created_at, updated_at',
      )
      .single();

    if (error || !item) {
      console.error('[APP_ITEMS] Error al eliminar item:', error);
      throw new Error('Item no encontrado o sin permisos');
    }

    await auditService.registrarEvento({
      desarrolladorId,
      accion: ACCIONES_AUDITORIA.BORRAR_ITEM,
      recurso: `item:${item.id}`,
      detalles: {
        item_id: item.id,
        aplicacion_id: item.aplicacion_id,
        nombre: item.nombre,
      },
      ipAddress: requestMetadata.ip_address,
      userAgent: requestMetadata.user_agent,
    });

    return item;
  },
};
