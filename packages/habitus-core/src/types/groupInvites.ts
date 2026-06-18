/**
 * Types para Invitaciones y Solicitudes de Grupo
 */

import type {
  GroupInvite,
  GroupJoinRequest,
  GroupJoinRequestEstado,
  CrearGroupInviteInput,
} from './contratos';

export type { GroupInvite, GroupJoinRequest, GroupJoinRequestEstado as GroupJoinRequestState };

// Re-definir para incluir solicitante_id
export interface CrearGroupJoinRequestInput {
  grupo_id: string;
  solicitante_id: string;
  mensaje?: string;
}

// Re-definir para incluir expires_days
export interface CrearGroupInviteInputFull extends CrearGroupInviteInput {
  created_by?: string;
  expires_days?: number;
  max_uses?: number;
}

export interface ResponderGroupJoinRequestInput {
  estado: 'approved' | 'rejected';
}

export interface UsarGroupInviteInput {
  token: string;
  user_id: string;
  mensaje?: string;
}

export interface UsarGroupInviteResult {
  success: boolean;
  grupo_id?: string;
  join_request_id?: string;
  error?: string;
}
