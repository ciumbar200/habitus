/**
 * Servicio de Invitaciones y Solicitudes de Grupo
 */

import type {
  CrearGroupJoinRequestInput,
  ResponderGroupJoinRequestInput,
  CrearGroupInviteInputFull,
  UsarGroupInviteInput,
  UsarGroupInviteResult,
} from '../types/groupInvites';

// ============================================================================
// Join Requests (Solicitudes directas)
// ============================================================================

export function crearGroupJoinRequest(
  supabase: any,
  input: CrearGroupJoinRequestInput
) {
  return supabase
    .from('habitus_group_join_requests')
    .insert({
      grupo_id: input.grupo_id,
      solicitante_id: input.solicitante_id,
      mensaje: input.mensaje || null,
      estado: 'pending',
    })
    .select(`
      *,
      grupo:grupo_id (id, name, notes),
      solicitante:solicitante_id (id, display_name, avatar_url)
    `)
    .single();
}

export function getGroupJoinRequests(supabase: any, grupoId: string) {
  return supabase
    .from('habitus_group_join_requests')
    .select(`
      *,
      solicitante:solicitante_id (id, display_name, avatar_url, profile_score)
    `)
    .eq('grupo_id', grupoId)
    .eq('estado', 'pending')
    .order('created_at', { ascending: false });
}

export function getMisJoinRequests(supabase: any, userId: string) {
  return supabase
    .from('habitus_group_join_requests')
    .select(`
      *,
      grupo:grupo_id (id, name, notes, creator_id, target_members)
    `)
    .eq('solicitante_id', userId)
    .order('created_at', { ascending: false });
}

export function responderGroupJoinRequest(
  supabase: any,
  requestId: string,
  input: ResponderGroupJoinRequestInput & { responded_by: string }
) {
  return supabase
    .from('habitus_group_join_requests')
    .update({
      estado: input.estado,
      responded_by: input.responded_by,
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();
}

export function aprobarGroupJoinRequest(
  supabase: any,
  requestId: string,
  leaderId: string
) {
  // Primero aprobamos la request
  return supabase.rpc('aprobar_group_join_request', {
    p_request_id: requestId,
    p_leader_id: leaderId,
  });
}

export function rechazarGroupJoinRequest(
  supabase: any,
  requestId: string,
  leaderId: string
) {
  return supabase
    .from('habitus_group_join_requests')
    .update({
      estado: 'rejected',
      responded_by: leaderId,
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();
}

export function cancelarGroupJoinRequest(supabase: any, requestId: string, userId: string) {
  return supabase
    .from('habitus_group_join_requests')
    .update({
      estado: 'cancelled',
    })
    .eq('id', requestId)
    .eq('solicitante_id', userId)
    .select()
    .single();
}

// ============================================================================
// Invites (Enlaces con token)
// ============================================================================

export function crearGroupInvite(
  supabase: any,
  input: CrearGroupInviteInputFull
) {
  // Generar token único
  const token = generarToken();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (input.expires_days || 30));

  return supabase
    .from('habitus_group_invites')
    .insert({
      grupo_id: input.grupo_id,
      token,
      created_by: input.created_by,
      max_uses: input.max_uses || 5,
      expires_at: expiresAt.toISOString(),
    })
    .select(`
      *,
      grupo:grupo_id (id, name, notes)
    `)
    .single();
}

export function getGroupInvites(supabase: any, grupoId: string) {
  return supabase
    .from('habitus_group_invites')
    .select('*')
    .eq('grupo_id', grupoId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
}

export function getInviteByToken(supabase: any, token: string) {
  return supabase
    .from('habitus_group_invites')
    .select(`
      *,
      grupo:grupo_id (id, name, notes, creator_id, target_members)
    `)
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single();
}

export async function usarGroupInvite(
  supabase: any,
  input: UsarGroupInviteInput
): Promise<UsarGroupInviteResult> {
  // Verificar que el token sea válido
  const { data: invite, error } = await getInviteByToken(supabase, input.token);

  if (error || !invite) {
    return {
      success: false,
      error: 'Token inválido o expirado',
    };
  }

  if (invite.uses_count >= invite.max_uses) {
    return {
      success: false,
      error: 'El enlace ha alcanzado el máximo de usos',
    };
  }

  // Crear join request automáticamente
  const { data: request, error: requestError } = await crearGroupJoinRequest(supabase, {
    grupo_id: invite.grupo_id,
    solicitante_id: input.user_id,
    mensaje: input.mensaje || `Solicitud mediante enlace de invitación`,
  });

  if (requestError) {
    return {
      success: false,
      error: requestError.message,
    };
  }

  // Incrementar contador de usos
  await supabase
    .from('habitus_group_invites')
    .update({ uses_count: invite.uses_count + 1 })
    .eq('id', invite.id);

  return {
    success: true,
    grupo_id: invite.grupo_id,
    join_request_id: request.id,
  };
}

export function revocarGroupInvite(supabase: any, inviteId: string) {
  return supabase
    .from('habitus_group_invites')
    .update({ expires_at: new Date().toISOString() })
    .eq('id', inviteId);
}

export function borrarGroupInvite(supabase: any, inviteId: string) {
  return supabase
    .from('habitus_group_invites')
    .delete()
    .eq('id', inviteId);
}

// ============================================================================
// Helpers
// ============================================================================

function generarToken(): string {
  // Generar token aleatorio de 16 caracteres
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function verificarPuedeUnirseGrupo(
  supabase: any,
  userId: string,
  grupoId: string
): Promise<{ puede: boolean; razon?: string }> {
  return supabase
    .rpc('verificar_puede_unirse_grupo', {
      p_user_id: userId,
      p_grupo_id: grupoId,
    });
}
