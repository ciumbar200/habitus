/**
 * Servicio de Gastos de Piso (Propietario)
 */

import type {
  CrearGastoPisoInput,
  ActualizarGastoPisoInput,
  GastoPisoTipo,
  PropietarioIngresosMetrics,
} from '../types/gastos';

export function getPisosPropietarioParaGastos(supabase: any, propietarioId: string) {
  return supabase
    .from('habitus_listings')
    .select('id, name, location, city, price_monthly')
    .eq('owner_profile_id', propietarioId)
    .order('name', { ascending: true });
}

export function getGastosPiso(supabase: any, pisoId: string) {
  return supabase
    .from('habitus_gastos_piso')
    .select(`
      *,
      piso:piso_id (
        id,
        name,
        location,
        city
      )
    `)
    .eq('piso_id', pisoId)
    .order('fecha', { ascending: false });
}

export function getGastosPisoByTipo(supabase: any, pisoId: string, tipo: GastoPisoTipo) {
  return supabase
    .from('habitus_gastos_piso')
    .select('*')
    .eq('piso_id', pisoId)
    .eq('tipo', tipo)
    .order('fecha', { ascending: false });
}

export function crearGastoPiso(supabase: any, input: CrearGastoPisoInput & { created_by?: string }) {
  return supabase
    .from('habitus_gastos_piso')
    .insert(input)
    .select()
    .single();
}

export function actualizarGastoPiso(supabase: any, gastoId: string, input: ActualizarGastoPisoInput) {
  return supabase
    .from('habitus_gastos_piso')
    .update(input)
    .eq('id', gastoId)
    .select()
    .single();
}

export function borrarGastoPiso(supabase: any, gastoId: string) {
  return supabase
    .from('habitus_gastos_piso')
    .delete()
    .eq('id', gastoId);
}

export function getResumenGastosPiso(supabase: any, pisoId: string, mes?: number, anio?: number) {
  // Calcular total de gastos por periodicidad
  let query = supabase
    .from('habitus_gastos_piso')
    .select('tipo, periodicidad, importe, fecha');

  query = query.eq('piso_id', pisoId);

  if (mes && anio) {
    // Filtrar por mes/año para gastos únicos
    query = query.or(`and(periodicidad.eq.unico,fecha.gte.${anio}-${mes}-01,fecha.lt.${anio}-${mes + 1}-01),periodicidad.neq.unico`);
  }

  return query;
}

// Métricas de ingresos para propietario
export async function getPropietarioIngresosMetrics(
  supabase: any,
  propietarioId: string
): Promise<PropietarioIngresosMetrics> {
  // Obtener contratos activos de habitaciones
  const { data: contratosHabitacion } = await supabase
    .from('habitus_contratos_habitacion')
    .select('id, renta_mensual, fecha_fin, habitacion:habitacion_id(name, listing_id)')
    .eq('anfitrion_id', propietarioId)
    .eq('estado', 'activo');

  // Obtener contratos activos de pisos
  const { data: contratosPiso } = await supabase
    .from('habitus_contratos_piso')
    .select('id, renta_mensual, fecha_fin, piso:piso_id(name)')
    .eq('propietario_id', propietarioId)
    .eq('estado', 'activo');

  const ingresosMensuales =
    (contratosHabitacion?.reduce((sum: number, c: any) => sum + Number(c.renta_mensual), 0) || 0) +
    (contratosPiso?.reduce((sum: number, c: any) => sum + Number(c.renta_mensual), 0) || 0);

  // Calcular próximos vencimientos
  const hoy = new Date();
  const proximosVencimientos = [];

  for (const c of [...(contratosHabitacion || []), ...(contratosPiso || [])]) {
    if (c.fecha_fin) {
      const fechaFin = new Date(c.fecha_fin);
      const diasRestantes = Math.floor((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      if (diasRestantes >= 0 && diasRestantes <= 60) {
        proximosVencimientos.push({
          contrato_id: c.id,
          fecha_fin: c.fecha_fin,
          dias_restantes: diasRestantes,
        });
      }
    }
  }

  return {
    ingresos_mensuales_actuales: ingresosMensuales,
    ingresos_proyectados_mes: ingresosMensuales,
    ingresos_proyectados_trimestre: ingresosMensuales * 3,
    ingresos_proyectados_anio: ingresosMensuales * 12,
    ocupacion_porcentaje: 0, // Calcular basado en capacidad total
    rentas_pendientes: 0, // Calcular basado en pagos registrados
    proximos_vencimientos: proximosVencimientos,
  };
}

export function getHistoricoIngresos(supabase: any, propietarioId: string, meses: number = 12) {
  const fechaInicio = new Date();
  fechaInicio.setMonth(fechaInicio.getMonth() - meses);

  return supabase
    .rpc('propietario_historico_ingresos', {
      p_propietario_id: propietarioId,
      p_meses: meses,
    });
}
