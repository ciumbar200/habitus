/**
 * Página de contratos de piso para propietarios
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getContratosPiso,
  type ContratoPisoEstado,
} from '@habitus/core';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

export function ContratosPisoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<ContratoPisoEstado | 'todos'>('todos');

  useEffect(() => {
    if (!user?.id) return;

    const cargarContratos = async () => {
      setLoading(true);
      const options = filtroEstado === 'todos' ? undefined : { estado: filtroEstado };
      const { data, error } = await getContratosPiso(supabase, user.id, options);
      if (data && !error) {
        setContratos(data);
      }
      setLoading(false);
    };

    cargarContratos();
  }, [user, supabase, filtroEstado]);

  const estadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      borrador: 'Borrador',
      pendiente_firma_grupos: 'Pendiente de firma del grupo',
      activo: 'Activo',
      finalizado: 'Finalizado',
      cancelado: 'Cancelado',
    };
    return labels[estado] || estado;
  };

  const estadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      borrador: 'bg-gray-100 text-gray-800',
      pendiente_firma_grupos: 'bg-yellow-100 text-yellow-800',
      activo: 'bg-green-100 text-green-800',
      finalizado: 'bg-blue-100 text-blue-800',
      cancelado: 'bg-red-100 text-red-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const getAceptacionesCount = (contrato: any) => {
    if (!contrato.aceptaciones_miembros) return 0;
    try {
      return Object.keys(contrato.aceptaciones_miembros).length;
    } catch {
      return 0;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pb-8 pt-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Contratos de Piso</h1>
          <p className="text-gray-600 mt-1">Gestiona los contratos con grupos para tus pisos</p>
        </div>
        <button
          onClick={() => navigate('/panel/propietarios/contratos/nuevo')}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
        >
          + Nuevo Contrato
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['todos', 'borrador', 'pendiente_firma_grupos', 'activo', 'finalizado'] as const).map(
          (estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-3 py-1 rounded-full text-sm transition ${
                filtroEstado === estado
                  ? 'bg-brand-100 text-brand-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {estado === 'todos' ? 'Todos' : estadoLabel(estado)}
            </button>
          )
        )}
      </div>

      {/* Lista de contratos */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando contratos...</div>
      ) : contratos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No tienes contratos de piso aún</p>
          <button
            onClick={() => navigate('/panel/propietarios/contratos/nuevo')}
            className="text-brand-600 hover:text-brand-700 font-medium"
          >
            Crear primer contrato →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {contratos.map((contrato) => {
            const aceptaciones = getAceptacionesCount(contrato);
            const estadoLabels: Record<string, string> = {
              borrador: 'Borrador',
              pendiente_firma_grupos: `Pendiente (${aceptaciones} firmas)`,
              activo: 'Activo',
              finalizado: 'Finalizado',
              cancelado: 'Cancelado',
            };
            const estadoLabel = estadoLabels[contrato.estado as keyof typeof estadoLabels] || contrato.estado;

            return (
              <div
                key={contrato.id}
                className="bg-white border rounded-lg p-6 hover:shadow-md transition cursor-pointer"
                onClick={() => navigate(`/panel/propietarios/contratos/${contrato.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {contrato.piso?.name || 'Piso'}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${estadoColor(
                          contrato.estado
                        )}`}
                      >
                        {estadoLabel}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      {contrato.grupo && (
                        <p>
                          <span className="font-medium">Grupo:</span> {contrato.grupo.name}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Dirección:</span>{' '}
                        {contrato.piso?.location}, {contrato.piso?.city}
                      </p>
                      <p>
                        <span className="font-medium">Renta:</span>{' '}
                        {new Intl.NumberFormat('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(Number(contrato.renta_mensual))}/mes
                      </p>
                      <p>
                        <span className="font-medium">Fianza total:</span>{' '}
                        {new Intl.NumberFormat('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(Number(contrato.fianza_total))}
                      </p>
                      <p>
                        <span className="font-medium">Inicio:</span>{' '}
                        {new Date(contrato.fecha_inicio).toLocaleDateString('es-ES')}
                      </p>
                      {contrato.fecha_fin && (
                        <p>
                          <span className="font-medium">Fin:</span>{' '}
                          {new Date(contrato.fecha_fin).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    Creado {new Date(contrato.created_at).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

}
