-- ============================================================================
-- Funciones RPC para grupos e ingresos
-- ============================================================================

-- Aprobar solicitud de unirse a grupo y añadir miembro
CREATE OR REPLACE FUNCTION aprobar_group_join_request(
    p_request_id UUID,
    p_leader_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_grupo_id UUID;
    v_solicitante_id UUID;
    v_request_estado TEXT;
BEGIN
    -- Obtener datos de la request
    SELECT grupo_id, solicitante_id, estado
    INTO v_grupo_id, v_solicitante_id, v_request_estado
    FROM habitus_group_join_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitud no encontrada';
    END IF;

    IF v_request_estado != 'pending' THEN
        RAISE EXCEPTION 'La solicitud ya fue procesada';
    END IF;

    -- Verificar que el usuario es líder del grupo
    IF NOT EXISTS (
        SELECT 1 FROM habitus_groups
        WHERE id = v_grupo_id
        AND creator_id = p_leader_id
    ) THEN
        RAISE EXCEPTION 'Solo el líder puede aprobar solicitudes';
    END IF;

    -- Actualizar request
    UPDATE habitus_group_join_requests
    SET
        estado = 'approved',
        responded_by = p_leader_id,
        responded_at = NOW()
    WHERE id = p_request_id;

    -- Añadir miembro al grupo
    INSERT INTO habitus_group_members (group_id, profile_id, role, is_confirmed)
    VALUES (v_grupo_id, v_solicitante_id, 'member', true)
    ON CONFLICT (group_id, profile_id)
    DO UPDATE SET is_confirmed = true, role = EXCLUDED.role;

    -- Retornar éxito
    RETURN jsonb_build_object(
        'success', true,
        'grupo_id', v_grupo_id::text,
        'profile_id', v_solicitante_id::text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar si un usuario puede unirse a un grupo
CREATE OR REPLACE FUNCTION verificar_puede_unirse_grupo(
    p_user_id UUID,
    p_grupo_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_es_miembro BOOLEAN;
    v_tiene_pendiente BOOLEAN;
BEGIN
    -- Verificar si ya es miembro
    SELECT EXISTS(
        SELECT 1 FROM habitus_group_members
        WHERE group_id = p_grupo_id
        AND profile_id = p_user_id
        AND is_confirmed = true
    ) INTO v_es_miembro;

    IF v_es_miembro THEN
        RETURN jsonb_build_object(
            'puede', false,
            'razon', 'Ya eres miembro de este grupo'
        );
    END IF;

    -- Verificar si tiene solicitud pendiente
    SELECT EXISTS(
        SELECT 1 FROM habitus_group_join_requests
        WHERE grupo_id = p_grupo_id
        AND solicitante_id = p_user_id
        AND estado = 'pending'
    ) INTO v_tiene_pendiente;

    IF v_tiene_pendiente THEN
        RETURN jsonb_build_object(
            'puede', false,
            'razon', 'Ya tienes una solicitud pendiente para este grupo'
        );
    END IF;

    RETURN jsonb_build_object('puede', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Histórico de ingresos de propietario
CREATE OR REPLACE FUNCTION propietario_historico_ingresos(
    p_propietario_id UUID,
    p_meses INTEGER DEFAULT 12
)
RETURNS TABLE (
    mes TEXT,
    ano INTEGER,
    ingresos_habitacion NUMERIC,
    ingresos_piso NUMERIC,
    total_ingresos NUMERIC
) AS $$
DECLARE
    v_fecha_inicio DATE;
    v_fecha_fin DATE;
BEGIN
    v_fecha_fin := CURRENT_DATE;
    v_fecha_inicio := v_fecha_fin - INTERVAL '1 month' * p_meses;

    RETURN QUERY
    WITH fechas AS (
        SELECT generate_series(
            v_fecha_inicio,
            v_fecha_fin,
            INTERVAL '1 month'
        )::DATE AS fecha
    ),
    meses AS (
        SELECT
            to_char(fecha, 'YYYY-MM') AS mes_id,
            extract(year FROM fecha)::INTEGER AS ano,
            to_char(fecha, 'TMMonth') AS mes_nombre
        FROM fechas
    ),
    ingresos_habitacion AS (
        SELECT
            m.mes_id,
            sum(renta_mensual) AS ingresos
        FROM habitus_contratos_habitacion
        JOIN meses m
          ON fecha_inicio <= (m.mes_id || '-01')::DATE + INTERVAL '1 month' - INTERVAL '1 day'
         AND (fecha_fin IS NULL OR fecha_fin >= (m.mes_id || '-01')::DATE)
        WHERE anfitrion_id = p_propietario_id
        AND estado = 'activo'
        GROUP BY m.mes_id
    ),
    ingresos_piso AS (
        SELECT
            m.mes_id,
            sum(renta_mensual) AS ingresos
        FROM habitus_contratos_piso
        JOIN meses m
          ON fecha_inicio <= (m.mes_id || '-01')::DATE + INTERVAL '1 month' - INTERVAL '1 day'
         AND (fecha_fin IS NULL OR fecha_fin >= (m.mes_id || '-01')::DATE)
        WHERE propietario_id = p_propietario_id
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios
COMMENT ON FUNCTION aprobar_group_join_request IS 'Aprobar solicitud de unirse a grupo y añadir al usuario como miembro';
COMMENT ON FUNCTION verificar_puede_unirse_grupo IS 'Verifica si un usuario puede unirse a un grupo (no es miembro, no tiene pendiente)';
COMMENT ON FUNCTION propietario_historico_ingresos IS 'Histórico de ingresos mensuales de un propietario';
