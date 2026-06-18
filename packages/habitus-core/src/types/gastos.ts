/**
 * Types para Gastos de Piso (Propietario)
 */

import type { GastoPiso, GastoTipo, GastoPeriodicidad } from './contratos';

export type { GastoPiso, GastoTipo as GastoPisoTipo, GastoPeriodicidad };

// Re-definir CrearGastoPisoInput para evitar circularidad
export interface CrearGastoPisoInput {
  piso_id: string;
  concepto: string;
  importe: number;
  tipo: GastoTipo;
  periodicidad: GastoPeriodicidad;
  fecha: string;
}

export interface ActualizarGastoPisoInput extends Partial<CrearGastoPisoInput> {}

export interface PropietarioIngresosMetrics {
  ingresos_mensuales_actuales: number;
  ingresos_proyectados_mes: number;
  ingresos_proyectados_trimestre: number;
  ingresos_proyectados_anio: number;
  ocupacion_porcentaje: number;
  rentas_pendientes: number;
  proximos_vencimientos: Array<{
    contrato_id: string;
    fecha_fin: string;
    dias_restantes: number;
  }>;
}
