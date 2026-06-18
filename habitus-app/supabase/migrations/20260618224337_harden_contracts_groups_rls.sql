-- ============================================================================
-- Hardening de contratos, gastos e invitaciones de grupo
-- ============================================================================
-- Corrige hallazgos de Supabase advisors sobre objetos del plan:
-- - contrato_estado_log sin RLS
-- - RPC SECURITY DEFINER ejecutables por anon
-- - funciones sin search_path fijo
-- - RPC que confiaban en IDs enviados por cliente para autorización

-- ---------------------------------------------------------------------------
-- Audit log de estados
-- ---------------------------------------------------------------------------

ALTER TABLE public.contrato_estado_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contrato_estado_log_select_partes ON public.contrato_estado_log;
CREATE POLICY contrato_estado_log_select_partes
    ON public.contrato_estado_log
    FOR SELECT
    TO authenticated
    USING (
        cambiado_por = (select auth.uid())
        OR (
            contrato_tipo = 'habitus_contratos_habitacion'
            AND EXISTS (
                SELECT 1
                FROM public.habitus_contratos_habitacion c
                WHERE c.id = contrato_estado_log.contrato_id
                  AND (
                    c.anfitrion_id = (select auth.uid())
                    OR c.inquilino_id = (select auth.uid())
                    OR c.created_by = (select auth.uid())
                  )
            )
        )
        OR (
            contrato_tipo = 'habitus_contratos_piso'
            AND EXISTS (
                SELECT 1
                FROM public.habitus_contratos_piso c
                WHERE c.id = contrato_estado_log.contrato_id
                  AND (
                    c.propietario_id = (select auth.uid())
                    OR c.created_by = (select auth.uid())
                    OR EXISTS (
                        SELECT 1
                        FROM public.habitus_group_members gm
                        WHERE gm.group_id = c.grupo_id
                          AND gm.profile_id = (select auth.uid())
                          AND gm.is_confirmed = true
                    )
                  )
            )
        )
    );

-- El trigger es el único writer previsto del audit log. SECURITY DEFINER evita
-- necesitar una política INSERT amplia sobre la tabla de auditoría.
CREATE OR REPLACE FUNCTION public.log_estado_cambio()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado) THEN
        INSERT INTO public.contrato_estado_log (
            contrato_tipo,
            contrato_id,
            estado_anterior,
            estado_nuevo,
            cambiado_por,
            cambiado_at
        )
        VALUES (
            TG_TABLE_NAME,
            NEW.id,
            OLD.estado,
            NEW.estado,
            auth.uid(),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.log_estado_cambio() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Helpers con search_path fijo
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_grupo_todos_aceptaron(p_contrato_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    p_grupo_id UUID;
    total_miembros INTEGER;
    aceptaciones JSONB;
    cuenta_aceptaciones INTEGER;
BEGIN
    SELECT grupo_id, aceptaciones_miembros
    INTO p_grupo_id, aceptaciones
    FROM public.habitus_contratos_piso
    WHERE id = p_contrato_id;

    SELECT COUNT(*) INTO total_miembros
    FROM public.habitus_group_members
    WHERE group_id = p_grupo_id AND is_confirmed = true;

    cuenta_aceptaciones := (
        SELECT COUNT(*)
        FROM jsonb_object_keys(COALESCE(aceptaciones, '{}'::jsonb))
    );

    RETURN cuenta_aceptaciones >= total_miembros;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC contratos/grupos: no confiar en IDs enviados por cliente
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.aceptar_contrato_piso_miembro(
    p_contrato_id UUID,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_grupo_id UUID;
    v_aceptaciones JSONB;
    v_total_miembros INTEGER;
    v_cuenta_aceptaciones INTEGER;
    v_contrato_estado TEXT;
    v_estado_final TEXT;
BEGIN
    IF v_actor IS NULL OR v_actor IS DISTINCT FROM p_user_id THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    SELECT grupo_id, aceptaciones_miembros, estado
    INTO v_grupo_id, v_aceptaciones, v_contrato_estado
    FROM public.habitus_contratos_piso
    WHERE id = p_contrato_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contrato no encontrado';
    END IF;

    IF v_contrato_estado != 'pendiente_firma_grupos' THEN
        RAISE EXCEPTION 'Solo se pueden aceptar contratos en estado pendiente_firma_grupos';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.habitus_group_members
        WHERE group_id = v_grupo_id
          AND profile_id = v_actor
          AND is_confirmed = true
    ) THEN
        RAISE EXCEPTION 'El usuario no es miembro activo del grupo';
    END IF;

    v_aceptaciones := COALESCE(v_aceptaciones, '{}'::jsonb);
    v_aceptaciones := v_aceptaciones || jsonb_build_object(v_actor::text, NOW()::text);

    SELECT COUNT(*) INTO v_total_miembros
    FROM public.habitus_group_members
    WHERE group_id = v_grupo_id AND is_confirmed = true;

    SELECT COUNT(*) INTO v_cuenta_aceptaciones
    FROM jsonb_object_keys(v_aceptaciones);

    v_estado_final := CASE
        WHEN v_cuenta_aceptaciones >= v_total_miembros THEN 'activo'
        ELSE 'pendiente_firma_grupos'
    END;

    UPDATE public.habitus_contratos_piso
    SET aceptaciones_miembros = v_aceptaciones,
        estado = v_estado_final
    WHERE id = p_contrato_id;

    RETURN jsonb_build_object(
        'success', true,
        'aceptaciones', v_cuenta_aceptaciones,
        'total_miembros', v_total_miembros,
        'estado', v_estado_final
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.aprobar_group_join_request(
    p_request_id UUID,
    p_leader_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_grupo_id UUID;
    v_solicitante_id UUID;
    v_request_estado TEXT;
BEGIN
    IF v_actor IS NULL OR v_actor IS DISTINCT FROM p_leader_id THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    SELECT grupo_id, solicitante_id, estado
    INTO v_grupo_id, v_solicitante_id, v_request_estado
    FROM public.habitus_group_join_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitud no encontrada';
    END IF;

    IF v_request_estado != 'pending' THEN
        RAISE EXCEPTION 'La solicitud ya fue procesada';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.habitus_groups
        WHERE id = v_grupo_id
          AND creator_id = v_actor
    ) THEN
        RAISE EXCEPTION 'Solo el líder puede aprobar solicitudes';
    END IF;

    UPDATE public.habitus_group_join_requests
    SET estado = 'approved',
        responded_by = v_actor,
        responded_at = NOW()
    WHERE id = p_request_id;

    INSERT INTO public.habitus_group_members (group_id, profile_id, role, is_confirmed)
    VALUES (v_grupo_id, v_solicitante_id, 'member', true)
    ON CONFLICT (group_id, profile_id)
    DO UPDATE SET is_confirmed = true, role = EXCLUDED.role;

    RETURN jsonb_build_object(
        'success', true,
        'grupo_id', v_grupo_id::text,
        'profile_id', v_solicitante_id::text
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.verificar_puede_unirse_grupo(
    p_user_id UUID,
    p_grupo_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_es_miembro BOOLEAN;
    v_tiene_pendiente BOOLEAN;
BEGIN
    IF v_actor IS NULL OR v_actor IS DISTINCT FROM p_user_id THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    SELECT EXISTS(
        SELECT 1
        FROM public.habitus_group_members
        WHERE group_id = p_grupo_id
          AND profile_id = v_actor
          AND is_confirmed = true
    ) INTO v_es_miembro;

    IF v_es_miembro THEN
        RETURN jsonb_build_object('puede', false, 'razon', 'Ya eres miembro de este grupo');
    END IF;

    SELECT EXISTS(
        SELECT 1
        FROM public.habitus_group_join_requests
        WHERE grupo_id = p_grupo_id
          AND solicitante_id = v_actor
          AND estado = 'pending'
    ) INTO v_tiene_pendiente;

    IF v_tiene_pendiente THEN
        RETURN jsonb_build_object('puede', false, 'razon', 'Ya tienes una solicitud pendiente para este grupo');
    END IF;

    RETURN jsonb_build_object('puede', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.propietario_historico_ingresos(
    p_propietario_id UUID,
    p_meses INTEGER DEFAULT 12
)
RETURNS TABLE (
    mes TEXT,
    ano INTEGER,
    ingresos_habitacion NUMERIC,
    ingresos_piso NUMERIC,
    total_ingresos NUMERIC
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_fecha_inicio DATE;
    v_fecha_fin DATE;
BEGIN
    IF v_actor IS NULL OR v_actor IS DISTINCT FROM p_propietario_id THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    v_fecha_fin := CURRENT_DATE;
    v_fecha_inicio := v_fecha_fin - INTERVAL '1 month' * p_meses;

    RETURN QUERY
    WITH fechas AS (
        SELECT generate_series(v_fecha_inicio, v_fecha_fin, INTERVAL '1 month')::DATE AS fecha
    ),
    meses AS (
        SELECT
            to_char(fecha, 'YYYY-MM') AS mes_id,
            extract(year FROM fecha)::INTEGER AS ano,
            to_char(fecha, 'TMMonth') AS mes_nombre
        FROM fechas
    ),
    ingresos_habitacion AS (
        SELECT m.mes_id, sum(renta_mensual) AS ingresos
        FROM public.habitus_contratos_habitacion
        JOIN meses m
          ON fecha_inicio <= (m.mes_id || '-01')::DATE + INTERVAL '1 month' - INTERVAL '1 day'
         AND (fecha_fin IS NULL OR fecha_fin >= (m.mes_id || '-01')::DATE)
        WHERE anfitrion_id = v_actor
          AND estado = 'activo'
        GROUP BY m.mes_id
    ),
    ingresos_piso AS (
        SELECT m.mes_id, sum(renta_mensual) AS ingresos
        FROM public.habitus_contratos_piso
        JOIN meses m
          ON fecha_inicio <= (m.mes_id || '-01')::DATE + INTERVAL '1 month' - INTERVAL '1 day'
         AND (fecha_fin IS NULL OR fecha_fin >= (m.mes_id || '-01')::DATE)
        WHERE propietario_id = v_actor
          AND estado = 'activo'
        GROUP BY m.mes_id
    )
    SELECT
        m.mes_id,
        m.ano,
        COALESCE(ih.ingresos, 0)::NUMERIC AS ingresos_habitacion,
        COALESCE(ip.ingresos, 0)::NUMERIC AS ingresos_piso,
        COALESCE(ih.ingresos, 0)::NUMERIC + COALESCE(ip.ingresos, 0)::NUMERIC AS total_ingresos
    FROM meses m
    LEFT JOIN ingresos_habitacion ih ON m.mes_id = ih.mes_id
    LEFT JOIN ingresos_piso ip ON m.mes_id = ip.mes_id
    ORDER BY m.mes_id;
END;
$$;

-- Denegar RPC sensibles al rol anónimo. Mantener authenticated porque la app
-- usa estas RPC desde cliente autenticado y serverless con JWT de usuario.
REVOKE ALL ON FUNCTION public.aceptar_contrato_piso_miembro(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aprobar_group_join_request(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verificar_puede_unirse_grupo(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.propietario_historico_ingresos(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_grupo_todos_aceptaron(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aceptar_contrato_piso_miembro(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.aprobar_group_join_request(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.verificar_puede_unirse_grupo(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.propietario_historico_ingresos(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.check_grupo_todos_aceptaron(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.log_estado_cambio() FROM anon;
REVOKE ALL ON FUNCTION public.log_estado_cambio() FROM authenticated;

GRANT EXECUTE ON FUNCTION public.aceptar_contrato_piso_miembro(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aprobar_group_join_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verificar_puede_unirse_grupo(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.propietario_historico_ingresos(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_grupo_todos_aceptaron(UUID) TO authenticated;
