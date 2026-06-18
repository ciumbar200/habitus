/**
 * Página de detalle de contrato de habitación
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getContratoHabitacionById,
  ofertarContratoHabitacion,
  aceptarContratoHabitacion,
  rechazarContratoHabitacion,
  finalizarContratoHabitacion,
  cancelarContratoHabitacion,
  downloadPdfBytes,
  generateContractPdf,
} from '@habitus/core';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

export function ContratoHabitacionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [contrato, setContrato] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accionLoading, setAccionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const cargarContrato = async () => {
      const { data, error } = await getContratoHabitacionById(supabase, id);
      if (data && !error) {
        setContrato(data);
      }
      setLoading(false);
    };

    cargarContrato();
  }, [id, supabase]);

  const handleOfertar = async () => {
    if (!contrato) return;
    setAccionLoading(true);

    const { error } = await ofertarContratoHabitacion(supabase, contrato.id, {
      inquilino_id: contrato.inquilino_id,
      fecha_inicio: contrato.fecha_inicio,
      fecha_fin: contrato.fecha_fin,
      renta_mensual: contrato.renta_mensual,
      fianza_meses: contrato.fianza_meses,
      condiciones_especiales: contrato.condiciones_especiales,
    });

    setAccionLoading(false);
    if (!error) {
      window.location.reload();
    }
  };

  const handleAceptar = async () => {
    if (!contrato || !user?.id) return;
    setAccionLoading(true);

    const { error } = await aceptarContratoHabitacion(supabase, contrato.id, user.id);

    setAccionLoading(false);
    if (!error) {
      window.location.reload();
    }
  };

  const handleRechazar = async () => {
    if (!contrato || !user?.id) return;
    setAccionLoading(true);

    const { error } = await rechazarContratoHabitacion(supabase, contrato.id, user.id);

    setAccionLoading(false);
    if (!error) {
      window.location.reload();
    }
  };

  const handleFinalizar = async () => {
    if (!contrato) return;
    setAccionLoading(true);

    const { error } = await finalizarContratoHabitacion(supabase, contrato.id);

    setAccionLoading(false);
    if (!error) {
      window.location.reload();
    }
  };

  const handleCancelar = async () => {
    if (!contrato) return;
    const motivo = prompt('Motivo de la cancelación:');
    if (!motivo) return;

    setAccionLoading(true);
    const { error } = await cancelarContratoHabitacion(supabase, contrato.id, motivo);

    setAccionLoading(false);
    if (!error) {
      window.location.reload();
    }
  };

  const handleDownloadPdf = async () => {
    if (!contrato) return;
    const acceptedAt = contrato.estado === 'activo' ? contrato.updated_at : null;
    const bytes = await generateContractPdf({
      type: 'habitacion',
      reference: contrato.id,
      title: 'Contrato de habitación',
      propertyName: contrato.habitacion?.name || 'Habitación',
      propertyLocation: contrato.habitacion?.listing
        ? `${contrato.habitacion.listing.location}, ${contrato.habitacion.listing.city}`
        : null,
      parties: [
        {
          label: 'Anfitrión',
          name: contrato.anfitrion?.display_name || 'Anfitrión',
          acceptedAt: contrato.created_at,
        },
        {
          label: 'Inquilino',
          name: contrato.inquilino?.display_name || 'Inquilino',
          acceptedAt,
        },
      ],
      monthlyRent: Number(contrato.renta_mensual),
      depositLabel: `${contrato.fianza_meses} ${contrato.fianza_meses === 1 ? 'mes' : 'meses'}`,
      startDate: contrato.fecha_inicio,
      endDate: contrato.fecha_fin,
      specialConditions: contrato.condiciones_especiales,
    });
    downloadPdfBytes(`contrato-habitacion-${contrato.id.slice(0, 8)}.pdf`, bytes);
  };

  if (loading) {
    return <div className="px-4 pb-8 pt-24 text-center">Cargando contrato...</div>;
  }

  if (!contrato) {
    return <div className="px-4 pb-8 pt-24 text-center text-red-600">Contrato no encontrado</div>;
  }

  const esAnfitrion = user?.id === contrato.anfitrion_id;
  const esInquilino = user?.id === contrato.inquilino_id;
  const estadoLabel: Record<string, string> = {
    borrador: 'Borrador',
    pendiente_firma: 'Pendiente de firma',
    activo: 'Activo',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado',
  };

  const estadoColor: Record<string, string> = {
    borrador: 'bg-gray-100 text-gray-800',
    pendiente_firma: 'bg-yellow-100 text-yellow-800',
    activo: 'bg-green-100 text-green-800',
    finalizado: 'bg-blue-100 text-blue-800',
    cancelado: 'bg-red-100 text-red-800',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-8 pt-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
          ← Volver
        </button>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${estadoColor[contrato.estado as keyof typeof estadoColor] || 'bg-gray-100'}`}>
          {estadoLabel[contrato.estado as keyof typeof estadoLabel] || contrato.estado}
        </span>
      </div>

      {/* Detalles del contrato */}
      <div className="bg-white border rounded-lg p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Contrato de Habitación</h1>
          <p className="text-gray-600">Referencia: {contrato.id.slice(0, 8)}...</p>
        </div>

        {/* Parte 1: Anfitrión */}
        <div className="border-t pt-6">
          <h2 className="font-semibold text-gray-900 mb-3">Anfitrión</h2>
          <p className="text-gray-700">{contrato.anfitrion?.display_name}</p>
        </div>

        {/* Parte 2: Inquilino */}
        <div className="border-t pt-6">
          <h2 className="font-semibold text-gray-900 mb-3">Inquilino</h2>
          <p className="text-gray-700">{contrato.inquilino?.display_name}</p>
        </div>

        {/* Habitación */}
        <div className="border-t pt-6">
          <h2 className="font-semibold text-gray-900 mb-3">Habitación</h2>
          <p className="text-gray-700">{contrato.habitacion?.name}</p>
          {contrato.habitacion?.listing && (
            <p className="text-sm text-gray-500">
              {contrato.habitacion.listing.location}, {contrato.habitacion.listing.city}
            </p>
          )}
        </div>

        {/* Términos económicos */}
        <div className="border-t pt-6">
          <h2 className="font-semibold text-gray-900 mb-3">Términos Económicos</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Renta mensual</p>
              <p className="font-semibold text-gray-900">
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(Number(contrato.renta_mensual))}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Fianza</p>
              <p className="font-semibold text-gray-900">
                {contrato.fianza_meses} {contrato.fianza_meses === 1 ? 'mes' : 'meses'}
              </p>
            </div>
          </div>
        </div>

        {/* Fechas */}
        <div className="border-t pt-6">
          <h2 className="font-semibold text-gray-900 mb-3">Fechas</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Fecha de inicio</p>
              <p className="font-semibold text-gray-900">
                {new Date(contrato.fecha_inicio).toLocaleDateString('es-ES')}
              </p>
            </div>
            {contrato.fecha_fin && (
              <div>
                <p className="text-gray-500">Fecha de fin</p>
                <p className="font-semibold text-gray-900">
                  {new Date(contrato.fecha_fin).toLocaleDateString('es-ES')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Condiciones especiales */}
        {contrato.condiciones_especiales && (
          <div className="border-t pt-6">
            <h2 className="font-semibold text-gray-900 mb-3">Condiciones Especiales</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{contrato.condiciones_especiales}</p>
          </div>
        )}

        {/* PDF */}
        <div className="border-t pt-6">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Descargar PDF del contrato
          </button>
          {contrato.pdf_url && (
            <a
              href={contrato.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Abrir PDF guardado
            </a>
          )}
        </div>

        {/* Acciones */}
        <div className="border-t pt-6 flex flex-wrap gap-3">
          {/* Anfitrión actions */}
          {esAnfitrion && contrato.estado === 'borrador' && (
            <button
              onClick={handleOfertar}
              disabled={accionLoading}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {accionLoading ? 'Procesando...' : 'Ofertar a inquilino'}
            </button>
          )}

          {esAnfitrion && (contrato.estado === 'activo' || contrato.estado === 'pendiente_firma') && (
            <>
              <button
                onClick={handleCancelar}
                disabled={accionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {accionLoading ? 'Procesando...' : 'Cancelar contrato'}
              </button>
              {contrato.estado === 'activo' && (
                <button
                  onClick={handleFinalizar}
                  disabled={accionLoading}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  {accionLoading ? 'Procesando...' : 'Finalizar contrato'}
                </button>
              )}
            </>
          )}

          {/* Inquilino actions */}
          {esInquilino && contrato.estado === 'pendiente_firma' && (
            <>
              <button
                onClick={handleAceptar}
                disabled={accionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {accionLoading ? 'Procesando...' : 'Aceptar y firmar'}
              </button>
              <button
                onClick={handleRechazar}
                disabled={accionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {accionLoading ? 'Procesando...' : 'Rechazar'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Audit log */}
      <div className="mt-6 bg-gray-50 border rounded-lg p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Historial</h2>
        <p className="text-sm text-gray-500">
          Creado {new Date(contrato.created_at).toLocaleString('es-ES')}
        </p>
        {contrato.updated_at !== contrato.created_at && (
          <p className="text-sm text-gray-500">
            Actualizado {new Date(contrato.updated_at).toLocaleString('es-ES')}
          </p>
        )}
      </div>
    </div>
  );

}
