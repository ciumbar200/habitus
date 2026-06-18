/**
 * Servicio de Contratos - Pisos Completos (Propietario ↔ Grupo)
 */

import type {
  ContratoPiso,
  ContratoPisoEstado,
  CrearContratoPisoInput,
  OfertarContratoPisoInput,
} from '../types/contratos';
import { fetchConfirmedGroupMemberIds, queueNotificationEvent } from './notifications';

export function crearContratoPiso(
  supabase: any,
  input: CrearContratoPisoInput & { propietario_id: string }
) {
  return supabase
    .from('habitus_contratos_piso')
    .insert({
      piso_id: input.piso_id,
      propietario_id: input.propietario_id,
      grupo_id: input.grupo_id,
      estado: 'borrador',
      fecha_inicio: input.fecha_inicio,
      fecha_fin: input.fecha_fin || null,
      renta_mensual: input.renta_mensual,
      fianza_total: input.fianza_total || Math.floor(input.renta_mensual * 2),
      distribucion_renta: input.distribucion_renta || null,
      condiciones_especiales: input.condiciones_especiales || null,
      aceptaciones_miembros: {},
    })
    .select()
    .single();
}

export async function ofertarContratoPiso(
  supabase: any,
  contratoId: string,
  input: OfertarContratoPisoInput
) {
  const result = await supabase
    .from('habitus_contratos_piso')
    .update({
      grupo_id: input.grupo_id,
      estado: 'pendiente_firma_grupos',
      fecha_inicio: input.fecha_inicio,
      fecha_fin: input.fecha_fin || null,
      renta_mensual: input.renta_mensual,
      fianza_total: input.fianza_total || Math.floor(input.renta_mensual * 2),
      distribucion_renta: input.distribucion_renta || null,
      condiciones_especiales: input.condiciones_especiales || null,
      aceptaciones_miembros: {},
    })
    .eq('id', contratoId)
    .select()
    .single();

  if (!result.error) {
    const memberIds = await fetchConfirmedGroupMemberIds(input.grupo_id);
    void queueNotificationEvent({
      type: 'contract_offer',
      profileIds: memberIds,
      title: 'Contrato de piso pendiente',
      body: 'Tu grupo tiene un contrato de piso pendiente de revisión y firma.',
      entityId: contratoId,
      deepLink: `/grupos/${input.grupo_id}/contrato`,
      idempotencyKey: `contract_flat_offer:${contratoId}`,
    });
  }

  return result;
}

export async function aceptarContratoPiso(
  supabase: any,
  contratoId: string,
  userId: string
) {
  // Primero agregar la aceptación del usuario
  const result = await supabase.rpc('aceptar_contrato_piso_miembro', {
    p_contrato_id: contratoId,
    p_user_id: userId,
  });

  if (!result.error) {
    const { data: contrato } = await supabase
      .from('habitus_contratos_piso')
      .select('propietario_id, grupo_id, estado')
      .eq('id', contratoId)
      .maybeSingle();

    if (contrato?.propietario_id) {
      void queueNotificationEvent({
        type: contrato.estado === 'activo' ? 'contract_active' : 'contract_accepted',
        profileIds: [contrato.propietario_id],
        title: contrato.estado === 'activo' ? 'Contrato de piso activo' : 'Firma recibida',
        body:
          contrato.estado === 'activo'
            ? 'Todos los miembros han aceptado el contrato de piso.'
            : 'Un miembro del grupo ha aceptado el contrato de piso.',
        entityId: contratoId,
        deepLink: `/panel/propietarios/contratos/${contratoId}`,
        idempotencyKey: `contract_flat_accept_owner:${contratoId}:${userId}:${contrato.estado}`,
      });
    }

    if (contrato?.estado === 'activo' && contrato.grupo_id) {
      const memberIds = await fetchConfirmedGroupMemberIds(contrato.grupo_id);
      void queueNotificationEvent({
        type: 'contract_active',
        profileIds: memberIds,
        title: 'Contrato de piso activo',
        body: 'Todos los miembros han firmado. El contrato del grupo queda activo.',
        entityId: contratoId,
        deepLink: `/grupos/${contrato.grupo_id}/contrato`,
        idempotencyKey: `contract_flat_active_group:${contratoId}`,
      });
    }
  }

  return result;
}

export async function rechazarContratoPiso(
  supabase: any,
  contratoId: string,
  _userId: string
) {
  const result = await supabase
    .from('habitus_contratos_piso')
    .update({
      // Si un miembro rechaza, el contrato se cancela
      estado: 'cancelado',
      condiciones_especiales: 'Miembro del grupo rechazó el contrato',
    })
    .eq('id', contratoId)
    .eq('estado', 'pendiente_firma_grupos')
    .select()
    .single();

  if (!result.error && result.data?.propietario_id) {
    void queueNotificationEvent({
      type: 'contract_rejected',
      profileIds: [result.data.propietario_id],
      title: 'Contrato de piso rechazado',
      body: 'Un miembro del grupo ha rechazado el contrato. La oferta queda cancelada.',
      entityId: contratoId,
      deepLink: `/panel/propietarios/contratos/${contratoId}`,
      idempotencyKey: `contract_flat_rejected:${contratoId}`,
    });
  }

  return result;
}

export function getContratosPiso(
  supabase: any,
  userId: string,
  options?: { estado?: ContratoPisoEstado }
) {
  let query = supabase
    .from('habitus_contratos_piso')
    .select(`
      *,
      piso:piso_id (
        id,
        name,
        location,
        city
      ),
      propietario:propietario_id (id, display_name),
      grupo:grupo_id (
        id,
        name,
        notes,
        creator_id
      )
    `)
    .eq('propietario_id', userId);

  if (options?.estado) {
    query = query.eq('estado', options.estado);
  }

  return query.order('created_at', { ascending: false });
}

export function getContratoPisoById(supabase: any, contratoId: string) {
  return supabase
    .from('habitus_contratos_piso')
    .select(`
      *,
      piso:piso_id (
        id,
        name,
        location,
        city
      ),
      propietario:propietario_id (id, display_name),
      grupo:grupo_id (
        id,
        name,
        notes,
        creator_id
      )
    `)
    .eq('id', contratoId)
    .single();
}

export function getContratoPisoParaGrupo(
  supabase: any,
  grupoId: string,
  estado?: ContratoPisoEstado
) {
  let query = supabase
    .from('habitus_contratos_piso')
    .select(`
      *,
      piso:piso_id (
        id,
        name,
        location,
        city
      ),
      propietario:propietario_id (id, display_name)
    `)
    .eq('grupo_id', grupoId);

  if (estado) {
    query = query.eq('estado', estado);
  } else {
    query = query.in('estado', ['pendiente_firma_grupos', 'activo']);
  }

  return query.single();
}

export function updateContratoPiso(
  supabase: any,
  contratoId: string,
  updates: Partial<ContratoPiso>
) {
  return supabase
    .from('habitus_contratos_piso')
    .update(updates)
    .eq('id', contratoId)
    .select()
    .single();
}

export function finalizarContratoPiso(supabase: any, contratoId: string) {
  return updateContratoPiso(supabase, contratoId, { estado: 'finalizado' });
}

export function cancelarContratoPiso(supabase: any, contratoId: string, motivo?: string) {
  return updateContratoPiso(supabase, contratoId, {
    estado: 'cancelado',
    condiciones_especiales: motivo || 'Contrato cancelado',
  });
}

export function getMiembrosGrupoParaContrato(
  supabase: any,
  grupoId: string
) {
  return supabase
    .from('habitus_group_members')
    .select(`
      profile_id,
      profile:profile_id (id, display_name)
    `)
    .eq('group_id', grupoId)
    .eq('is_confirmed', true);
}

export function verificarAceptacionesCompletas(
  supabase: any,
  contratoId: string
) {
  return supabase.rpc('check_grupo_todos_aceptaron', {
    p_contrato_id: contratoId,
  });
}

export function getAceptacionesPendientes(
  supabase: any,
  contratoId: string,
  grupoId: string
) {
  // Obtener miembros que aún no han aceptado
  return supabase
    .from('habitus_group_members')
    .select(`
      profile_id,
      profile:profile_id (id, display_name)
    `)
    .eq('group_id', grupoId)
    .eq('is_confirmed', true)
    .not('profile_id', 'in',
      supabase
        .from('habitus_contratos_piso')
        .select('aceptaciones_miembros')
        .eq('id', contratoId)
        .single()
        .then(({ data }: { data: { aceptaciones_miembros: Record<string, string> } | null }) =>
          data?.aceptaciones_miembros ? Object.keys(data.aceptaciones_miembros) : []
        )
    );
}
