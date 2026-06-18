/**
 * Página de gestión de invitaciones del grupo
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getGroupInvites,
  crearGroupInvite,
  revocarGroupInvite,
  borrarGroupInvite,
  getGroupJoinRequests,
  aprobarGroupJoinRequest,
  rechazarGroupJoinRequest,
  type CrearGroupInviteInputFull,
} from '@habitus/core';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export function GroupInvitesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invites, setInvites] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const cargarDatos = async () => {
      setLoading(true);

      // Cargar invitaciones
      const { data: invitesData } = await getGroupInvites(supabase, id);
      setInvites(invitesData || []);

      // Cargar solicitudes pendientes
      const { data: requestsData } = await getGroupJoinRequests(supabase, id);
      setRequests(requestsData || []);

      setLoading(false);
    };

    cargarDatos();
  }, [id, supabase]);

  const handleCrearInvite = async () => {
    if (!id || !user?.id) return;
    setCreatingInvite(true);

    const input: CrearGroupInviteInputFull = {
      grupo_id: id,
      created_by: user.id,
      max_uses: 5,
      expires_days: 30,
    };

    const { data, error } = await crearGroupInvite(supabase, input);

    setCreatingInvite(false);

    if (data && !error) {
      setInvites([data, ...invites]);
    }
  };

  const handleCopiarToken = (token: string) => {
    const url = `${window.location.origin}/grupos/join/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRevocar = async (inviteId: string) => {
    if (!confirm('¿Revocar este enlace?')) return;

    await revocarGroupInvite(supabase, inviteId);
    setInvites(invites.filter((i) => i.id !== inviteId));
  };

  const handleBorrar = async (inviteId: string) => {
    if (!confirm('¿Borrar este enlace?')) return;

    await borrarGroupInvite(supabase, inviteId);
    setInvites(invites.filter((i) => i.id !== inviteId));
  };

  const handleAprobarRequest = async (requestId: string) => {
    if (!user?.id) return;

    const result = await aprobarGroupJoinRequest(supabase, requestId, user.id);

    if (result) {
      setRequests(requests.filter((r) => r.id !== requestId));
    }
  };

  const handleRechazarRequest = async (requestId: string) => {
    if (!user?.id) return;

    await rechazarGroupJoinRequest(supabase, requestId, user.id);
    setRequests(requests.filter((r) => r.id !== requestId));
  };

  const getInviteUrl = (token: string) => `${window.location.origin}/grupos/join/${token}`;

  if (loading) {
    return <div className="px-4 pb-8 pt-24 text-center">Cargando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-8 pt-24">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900 mb-4">
          ← Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Invitar Miembros</h1>
        <p className="text-gray-600">Gestiona las invitaciones a tu grupo</p>
      </div>

      {/* Crear nueva invitación */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Crear Enlace de Invitación</h2>
        <p className="text-sm text-gray-600 mb-4">
          Comparte este enlace para que personas puedan solicitar unirse a tu grupo.
        </p>
        <button
          onClick={handleCrearInvite}
          disabled={creatingInvite}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
        >
          {creatingInvite ? 'Creando...' : 'Generar nuevo enlace'}
        </button>
      </div>

      {/* Enlaces activos */}
      {invites.length > 0 && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Enlaces Activos</h2>
          <div className="space-y-4">
            {invites.map((invite) => (
              <div key={invite.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {invite.uses_count}/{invite.max_uses} usos
                    </p>
                    <p className="text-sm text-gray-500">
                      Expira: {new Date(invite.expires_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRevocar(invite.id)}
                      className="text-sm text-gray-500 hover:text-red-600"
                    >
                      Revocar
                    </button>
                    <button
                      onClick={() => handleBorrar(invite.id)}
                      className="text-sm text-gray-500 hover:text-red-600"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm truncate">
                    {getInviteUrl(invite.token)}
                  </code>
                  <button
                    onClick={() => handleCopiarToken(invite.token)}
                    className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                  >
                    {copiedToken === invite.token ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solicitudes pendientes */}
      {requests.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Solicitudes Pendientes</h2>
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {request.solicitante?.display_name || 'Solicitante'}
                    </p>
                    {request.solicitante?.profile_score && (
                      <p className="text-sm text-gray-500">
                        Moon Score: {request.solicitante.profile_score}
                      </p>
                    )}
                    {request.mensaje && (
                      <p className="text-sm text-gray-600 mt-2 italic">"{request.mensaje}"</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Solicitó {new Date(request.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleAprobarRequest(request.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => handleRechazarRequest(request.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && invites.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No hay invitaciones ni solicitudes activas</p>
          <button
            onClick={handleCrearInvite}
            className="text-brand-600 hover:text-brand-700 font-medium"
          >
            Crear primera invitación →
          </button>
        </div>
      )}
    </div>
  );

}
