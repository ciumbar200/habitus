/**
 * Servicio de Contratos - Habitaciones (Anfitrión ↔ Inquilino)
 */

import type {
  ContratoHabitacion,
  ContratoHabitacionEstado,
  CrearContratoHabitacionInput,
  OfertarContratoHabitacionInput,
} from '../types/contratos';
import { queueNotificationEvent } from './notifications';

export function crearContratoHabitacion(
  supabase: any,
  input: CrearContratoHabitacionInput & { anfitrion_id: string }
) {
  return supabase
    .from('habitus_contratos_habitacion')
    .insert({
      habitacion_id: input.habitacion_id,
      anfitrion_id: input.anfitrion_id,
      inquilino_id: input.inquilino_id,
      estado: 'borrador',
      fecha_inicio: input.fecha_inicio,
      fecha_fin: input.fecha_fin || null,
      renta_mensual: input.renta_mensual,
      fianza_meses: input.fianza_meses || 2,
      condiciones_especiales: input.condiciones_especiales || null,
    })
    .select()
    .single();
}

export async function ofertarContratoHabitacion(
  supabase: any,
  contratoId: string,
  input: OfertarContratoHabitacionInput
) {
  const result = await supabase
    .from('habitus_contratos_habitacion')
    .update({
      inquilino_id: input.inquilino_id,
      estado: 'pendiente_firma',
      fecha_inicio: input.fecha_inicio,
      fecha_fin: input.fecha_fin || null,
      renta_mensual: input.renta_mensual,
      fianza_meses: input.fianza_meses || 2,
      condiciones_especiales: input.condiciones_especiales || null,
    })
    .eq('id', contratoId)
    .select()
    .single();

  if (!result.error) {
    void queueNotificationEvent({
      type: 'contract_offer',
      profileIds: [input.inquilino_id],
      title: 'Contrato pendiente de firma',
      body: 'Revisa la oferta de contrato de habitación en moon.',
      entityId: contratoId,
      deepLink: `/panel/anfitriones/contratos/${contratoId}`,
      idempotencyKey: `contract_room_offer:${contratoId}`,
    });
  }

  return result;
}

export async function aceptarContratoHabitacion(supabase: any, contratoId: string, userId: string) {
  const result = await supabase
    .from('habitus_contratos_habitacion')
    .update({ estado: 'activo' })
    .eq('id', contratoId)
    .eq('inquilino_id', userId)
    .eq('estado', 'pendiente_firma')
    .select()
    .single();

  if (!result.error && result.data?.anfitrion_id) {
    void queueNotificationEvent({
      type: 'contract_accepted',
      profileIds: [result.data.anfitrion_id],
      title: 'Contrato aceptado',
      body: 'El inquilino ha aceptado el contrato de habitación.',
      entityId: contratoId,
      deepLink: `/panel/anfitriones/contratos/${contratoId}`,
      idempotencyKey: `contract_room_accepted:${contratoId}`,
    });
  }

  return result;
}

export async function rechazarContratoHabitacion(supabase: any, contratoId: string, userId: string) {
  const result = await supabase
    .from('habitus_contratos_habitacion')
    .update({ estado: 'cancelado' })
    .eq('id', contratoId)
    .eq('inquilino_id', userId)
    .eq('estado', 'pendiente_firma')
    .select()
    .single();

  if (!result.error && result.data?.anfitrion_id) {
    void queueNotificationEvent({
      type: 'contract_rejected',
      profileIds: [result.data.anfitrion_id],
      title: 'Contrato rechazado',
      body: 'El inquilino ha rechazado el contrato de habitación.',
      entityId: contratoId,
      deepLink: `/panel/anfitriones/contratos/${contratoId}`,
      idempotencyKey: `contract_room_rejected:${contratoId}`,
    });
  }

  return result;
}

export function getContratosHabitacion(
  supabase: any,
  userId: string,
  options?: { estado?: ContratoHabitacionEstado }
) {
  let query = supabase
    .from('habitus_contratos_habitacion')
    .select(`
      *,
      habitacion:habitacion_id (
        id,
        name,
        listing_id,
        listing:listing_id (id, name, location, city)
      ),
      anfitrion:anfitrion_id (id, display_name),
      inquilino:inquilino_id (id, display_name)
    `)
    .or(`anfitrion_id.eq.${userId},inquilino_id.eq.${userId}`);

  if (options?.estado) {
    query = query.eq('estado', options.estado);
  }

  return query.order('created_at', { ascending: false });
}

export function getContratoHabitacionById(supabase: any, contratoId: string) {
  return supabase
    .from('habitus_contratos_habitacion')
    .select(`
      *,
      habitacion:habitacion_id (
        id,
        name,
        listing_id,
        listing:listing_id (id, name, location, city)
      ),
      anfitrion:anfitrion_id (id, display_name),
      inquilino:inquilino_id (id, display_name)
    `)
    .eq('id', contratoId)
    .single();
}

export function updateContratoHabitacion(
  supabase: any,
  contratoId: string,
  updates: Partial<ContratoHabitacion>
) {
  return supabase
    .from('habitus_contratos_habitacion')
    .update(updates)
    .eq('id', contratoId)
    .select()
    .single();
}

export function finalizarContratoHabitacion(supabase: any, contratoId: string) {
  return updateContratoHabitacion(supabase, contratoId, { estado: 'finalizado' });
}

export function cancelarContratoHabitacion(supabase: any, contratoId: string, motivo?: string) {
  return updateContratoHabitacion(supabase, contratoId, {
    estado: 'cancelado',
    condiciones_especiales: motivo || 'Contrato cancelado',
  });
}
