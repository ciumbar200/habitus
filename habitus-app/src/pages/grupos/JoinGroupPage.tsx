/**
 * Página para unirse a un grupo vía enlace de invitación
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInviteByToken, usarGroupInvite } from '@habitus/core';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export function JoinGroupPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [solicitando, setSolicitando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;

    const cargarInvite = async () => {
      setLoading(true);
      const { data, error } = await getInviteByToken(supabase, token);

      if (error || !data) {
        setError('El enlace de invitación no es válido o ha expirado');
      } else {
        setInvite(data);
      }

      setLoading(false);
    };

    cargarInvite();
  }, [token, supabase]);

  const handleSolicitar = async () => {
    if (!invite || !user?.id || !token) return;

    setSolicitando(true);
    setError(null);

    const resultado = await usarGroupInvite(supabase, {
      token,
      user_id: user.id,
      mensaje,
    });

    setSolicitando(false);

    if (resultado.success) {
      setSuccess(true);
    } else {
      setError(resultado.error || 'Error al procesar la solicitud');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando invitación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Enlace inválido</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">¡Solicitud enviada!</h1>
          <p className="text-gray-600 mb-6">
            Tu solicitud ha sido enviada al líder del grupo. Te notificaremos cuando sea aprobada.
          </p>
          <button
            onClick={() => navigate('/grupos')}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            Ver mis grupos
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border rounded-lg p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Inicia sesión</h1>
          <p className="text-gray-600 mb-6">
            Necesitas iniciar sesión para unirte a este grupo.
          </p>
          <button
            onClick={() => navigate(`/login?redirect=/grupos/join/${token}`)}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border rounded-lg p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Únete a {invite?.grupo?.name}</h1>

        {invite?.grupo?.notes && (
          <p className="text-gray-600 mb-6">{invite.grupo.notes}</p>
        )}

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">
            Al unirte, podrás compartir gastos, gestionar incidentes y convivencia con el grupo.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje opcional para el líder
            </label>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Presentación breve..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <button
            onClick={handleSolicitar}
            disabled={solicitando}
            className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
          >
            {solicitando ? 'Enviando solicitud...' : 'Solicitar unirse'}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );

}
