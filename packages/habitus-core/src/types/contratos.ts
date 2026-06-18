/**
 * Tipos para el sistema de contratos Moon
 */

// ============================================================================
// Contratos Habitación (Anfitrión ↔ Inquilino)
// ============================================================================

export type ContratoHabitacionEstado =
  | 'borrador'
  | 'pendiente_firma'
  | 'activo'
  | 'finalizado'
  | 'cancelado';

export interface ContratoHabitacion {
  id: string;
  habitacion_id: string | null;
  anfitrion_id: string | null;
  inquilino_id: string | null;
  estado: ContratoHabitacionEstado;
  fecha_inicio: string; // ISO date
  fecha_fin: string | null; // ISO date o null para indefinidos
  renta_mensual: number;
  fianza_meses: number;
  condiciones_especiales: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;

  // Join con otras tablas (cuando se consulta con includes)
  habitacion?: {
    id: string;
    name: string;
    listing_id: string;
    listing?: {
      id: string;
      name: string;
      location: string;
      city: string;
    };
  };
  anfitrion?: {
    id: string;
    display_name: string;
  };
  inquilino?: {
    id: string;
    display_name: string;
  };
}

// ============================================================================
// Contratos Piso (Propietario ↔ Grupo)
// ============================================================================

export type ContratoPisoEstado =
  | 'borrador'
  | 'pendiente_firma_grupos'
  | 'activo'
  | 'finalizado'
  | 'cancelado';

export interface DistribucionRenta {
  habitacion_id: string;
  importe: number;
}

export interface ContratoPiso {
  id: string;
  piso_id: string | null;
  propietario_id: string | null;
  grupo_id: string | null;
  estado: ContratoPisoEstado;
  fecha_inicio: string;
  fecha_fin: string | null;
  renta_mensual: number;
  fianza_total: number;
  distribucion_renta: DistribucionRenta[] | null;
  condiciones_especiales: string | null;
  pdf_url: string | null;
  aceptaciones_miembros: Record<string, string>; // member_id -> timestamp
  created_at: string;
  updated_at: string;
  created_by: string | null;

  // Join con otras tablas
  piso?: {
    id: string;
    name: string;
    location: string;
    city: string;
  };
  propietario?: {
    id: string;
    display_name: string;
  };
  grupo?: {
    id: string;
    name: string;
    notes: string | null;
    creator_id: string;
    miembros?: Array<{
      profile_id: string;
      display_name: string;
    }>;
  };
}

// ============================================================================
// Gastos de Piso
// ============================================================================

export type GastoTipo = 'fijo' | 'variable' | 'amortizacion';
export type GastoPeriodicidad = 'mensual' | 'trimestral' | 'anual' | 'unico';

export interface GastoPiso {
  id: string;
  piso_id: string;
  concepto: string;
  importe: number;
  tipo: GastoTipo;
  periodicidad: GastoPeriodicidad;
  fecha: string;
  created_at: string;
  created_by: string | null;

  piso?: {
    id: string;
    name: string;
    location: string;
  };
}

// ============================================================================
// Invitaciones y Join Requests
// ============================================================================

export type GroupJoinRequestEstado =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export interface GroupJoinRequest {
  id: string;
  grupo_id: string;
  solicitante_id: string;
  mensaje: string | null;
  estado: GroupJoinRequestEstado;
  created_at: string;
  updated_at: string;
  responded_by: string | null;
  responded_at: string | null;

  grupo?: {
    id: string;
    name: string;
    notes: string | null;
    creator_id: string;
  };
  solicitante?: {
    id: string;
    display_name: string;
    bio: string | null;
  };
}

export interface GroupInvite {
  id: string;
  grupo_id: string;
  token: string;
  created_by: string | null;
  max_uses: number;
  uses_count: number;
  expires_at: string;
  created_at: string;

  grupo?: {
    id: string;
    name: string;
    notes: string | null;
  };
}

// ============================================================================
// Métricas de Ingresos
// ============================================================================

export interface IngresosMensuales {
  mes: string; // YYYY-MM
  ingreso_total: number;
  ingreso_neto: number;
  ocupacion_porcentaje: number;
  contratos_activos: number;
  gastos_totales: number;
}

export interface IngresosProyectados {
  mes: string;
  ingresos_esperados: number;
  gastos_fijos: number;
  margen_neto: number;
}

export interface ContratoActivoResumen {
  id: string;
  tipo: 'habitacion' | 'piso';
  titulo: string; // del piso/habitación
  otra_parte: string; // nombre del inquilino o grupo
  renta_mensual: number;
  proximo_pago: string | null;
  estado: 'al_dia' | 'pendiente' | 'atrasado';
  fecha_fin: string | null;
}

// ============================================================================
// Logs de Auditoría
// ============================================================================

export interface ContratoEstadoLog {
  id: string;
  contrato_tipo: 'habitacion' | 'piso';
  contrato_id: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  cambiado_por: string;
  cambiado_at: string;
}

// ============================================================================
// Payloads para crear/actualizar
// ============================================================================

export interface CrearContratoHabitacionInput {
  habitacion_id: string;
  inquilino_id: string;
  fecha_inicio: string;
  fecha_fin?: string;
  renta_mensual: number;
  fianza_meses?: number;
  condiciones_especiales?: string;
}

export interface OfertarContratoHabitacionInput {
  inquilino_id: string;
  fecha_inicio: string;
  fecha_fin?: string;
  renta_mensual: number;
  fianza_meses?: number;
  condiciones_especiales?: string;
}

export interface CrearContratoPisoInput {
  piso_id: string;
  grupo_id: string;
  fecha_inicio: string;
  fecha_fin?: string;
  renta_mensual: number;
  fianza_total?: number;
  distribucion_renta?: DistribucionRenta[];
  condiciones_especiales?: string;
}

export interface OfertarContratoPisoInput {
  grupo_id: string;
  fecha_inicio: string;
  fecha_fin?: string;
  renta_mensual: number;
  fianza_total?: number;
  distribucion_renta?: DistribucionRenta[];
  condiciones_especiales?: string;
}

export interface CrearGastoPisoInput {
  piso_id: string;
  concepto: string;
  importe: number;
  tipo: GastoTipo;
  periodicidad: GastoPeriodicidad;
  fecha: string;
}

export interface CrearGroupInviteInput {
  grupo_id: string;
  max_uses?: number;
  expira_en_dias?: number;
}

export interface CrearGroupJoinRequestInput {
  grupo_id: string;
  mensaje?: string;
}
