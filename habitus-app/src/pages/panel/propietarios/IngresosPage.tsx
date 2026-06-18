/**
 * Dashboard de ingresos para propietarios
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getGastosPiso,
  getHistoricoIngresos,
  getPisosPropietarioParaGastos,
  getPropietarioIngresosMetrics,
} from '@habitus/core';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

type PisoOption = {
  id: string;
  name: string;
  location: string | null;
  city: string | null;
};

export function IngresosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPiso, setSelectedPiso] = useState<string | null>(null);
  const [pisos, setPisos] = useState<PisoOption[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    const cargarDatos = async () => {
      setLoading(true);

      const [data, pisosResult, historicoResult] = await Promise.all([
        getPropietarioIngresosMetrics(supabase, user.id),
        getPisosPropietarioParaGastos(supabase, user.id),
        getHistoricoIngresos(supabase, user.id, 12),
      ]);
      const pisosData = (pisosResult.data || []) as PisoOption[];
      setMetrics(data);
      setPisos(pisosData);
      setSelectedPiso((current) => current ?? pisosData[0]?.id ?? null);
      setHistorico(historicoResult.data || []);

      setLoading(false);
    };

    cargarDatos();
  }, [user, supabase]);

  useEffect(() => {
    if (!selectedPiso || !supabase) return;

    const cargarGastos = async () => {
      const { data } = await getGastosPiso(supabase, selectedPiso);
      setGastos(data || []);
    };

    cargarGastos();
  }, [selectedPiso, supabase]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 pb-8 pt-24">
        <div className="text-center py-12 text-gray-500">Cargando datos de ingresos...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="max-w-7xl mx-auto px-4 pb-8 pt-24">
        <div className="text-center py-12 text-red-600">Error al cargar datos</div>
      </div>
    );
  }

  const formatoMoneda = (valor: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);

  const gastosTotales = gastos.reduce((sum, g) => sum + Number(g.importe), 0);
  const ingresosNetos = metrics.ingresos_mensuales_actuales - gastosTotales;

  return (
    <div className="max-w-7xl mx-auto px-4 pb-8 pt-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mis Ingresos</h1>
        <p className="text-gray-600 mt-1">Resumen financiero de tus propiedades</p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border rounded-lg p-6">
          <p className="text-sm text-gray-500 mb-1">Ingresos mensuales</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatoMoneda(metrics.ingresos_mensuales_actuales)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Este mes</p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <p className="text-sm text-gray-500 mb-1">Ingresos netos</p>
          <p className="text-2xl font-bold text-green-600">{formatoMoneda(ingresosNetos)}</p>
          <p className="text-xs text-gray-500 mt-2">Después de gastos</p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <p className="text-sm text-gray-500 mb-1">Proyección anual</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatoMoneda(metrics.ingresos_proyectados_anio)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Últimos 12 meses</p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <p className="text-sm text-gray-500 mb-1">Ocupación</p>
          <p className="text-2xl font-bold text-gray-900">{metrics.ocupacion_porcentaje}%</p>
          <p className="text-xs text-gray-500 mt-2">Capacidad utilizada</p>
        </div>
      </div>

      {historico.length > 0 && (
        <div className="bg-white border rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">Ingresos últimos 12 meses</h2>
          <div className="space-y-3">
            {historico.map((row) => {
              const total = Number(row.total_ingresos || 0);
              const max = Math.max(...historico.map((item) => Number(item.total_ingresos || 0)), 1);
              return (
                <div key={row.mes} className="grid grid-cols-[90px_1fr_90px] items-center gap-3 text-sm">
                  <span className="text-gray-500">{row.mes}</span>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-brand-500"
                      style={{ width: `${Math.max(4, (total / max) * 100)}%` }}
                    />
                  </div>
                  <span className="text-right font-medium text-gray-900">{formatoMoneda(total)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gráficos y proyecciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Proyecciones trimestrales */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Proyección de Ingresos</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Este mes</span>
              <span className="font-semibold">
                {formatoMoneda(metrics.ingresos_proyectados_mes)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Este trimestre</span>
              <span className="font-semibold">
                {formatoMoneda(metrics.ingresos_proyectados_trimestre)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Este año</span>
              <span className="font-semibold">
                {formatoMoneda(metrics.ingresos_proyectados_anio)}
              </span>
            </div>
          </div>
        </div>

        {/* Próximos vencimientos */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Próximos Vencimientos</h2>
          {metrics.proximos_vencimientos.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay contratos próximos a vencer</p>
          ) : (
            <div className="space-y-3">
              {metrics.proximos_vencimientos.map((v: any) => (
                <div
                  key={v.contrato_id}
                  className="flex justify-between items-center text-sm border-b pb-2"
                >
                  <span className="text-gray-600">Contrato #{v.contrato_id.slice(0, 8)}</span>
                  <span
                    className={`font-medium ${
                      v.dias_restantes <= 7 ? 'text-red-600' : 'text-yellow-600'
                    }`}
                  >
                    {v.dias_restantes} días
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gastos */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-900">Gastos Mensuales</h2>
          {selectedPiso && (
            <button
              onClick={() => setSelectedPiso(null)}
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              Ver todos
            </button>
          )}
        </div>

        {!selectedPiso ? (
          <p className="text-gray-500 text-sm mb-4">No hay pisos para calcular gastos</p>
        ) : gastos.length === 0 ? (
          <div>
            <select
              value={selectedPiso}
              onChange={(event) => setSelectedPiso(event.target.value)}
              className="mb-4 w-full max-w-md rounded-lg border px-3 py-2 text-sm"
            >
              {pisos.map((piso) => (
                <option key={piso.id} value={piso.id}>
                  {piso.name} · {piso.city ?? 'Sin ciudad'}
                </option>
              ))}
            </select>
            <p className="text-gray-500 text-sm mb-4">No hay gastos registrados</p>
          </div>
        ) : (
          <>
            <select
              value={selectedPiso}
              onChange={(event) => setSelectedPiso(event.target.value)}
              className="mb-4 w-full max-w-md rounded-lg border px-3 py-2 text-sm"
            >
              {pisos.map((piso) => (
                <option key={piso.id} value={piso.id}>
                  {piso.name} · {piso.city ?? 'Sin ciudad'}
                </option>
              ))}
            </select>
            <div className="space-y-3">
              {gastos.map((gasto) => (
                <div key={gasto.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium text-gray-900">{gasto.concepto}</p>
                    <p className="text-xs text-gray-500">
                      {gasto.tipo} • {gasto.periodicidad}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatoMoneda(Number(gasto.importe))}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t-2">
                <span className="font-semibold text-gray-900">Total gastos</span>
                <span className="font-bold text-red-600">{formatoMoneda(gastosTotales)}</span>
              </div>
            </div>
          </>
        )}

        {/* Acciones */}
        <div className="mt-4 flex gap-3">
          {selectedPiso && (
            <button
              onClick={() => navigate(`/panel/propietarios/gastos/${selectedPiso}`)}
              className="px-3 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700"
            >
              Gestionar gastos
            </button>
          )}
        </div>
      </div>

      {/* Navegación rápida */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/panel/propietarios/contratos')}
          className="bg-white border rounded-lg p-4 text-left hover:shadow-md transition"
        >
          <h3 className="font-semibold text-gray-900">Ver Contratos</h3>
          <p className="text-sm text-gray-500">Gestiona todos tus contratos activos</p>
        </button>
        <button
          onClick={() => navigate('/panel/espacios')}
          className="bg-white border rounded-lg p-4 text-left hover:shadow-md transition"
        >
          <h3 className="font-semibold text-gray-900">Mis Pisos</h3>
          <p className="text-sm text-gray-500">Gestiona tus propiedades</p>
        </button>
      </div>
    </div>
  );

}
