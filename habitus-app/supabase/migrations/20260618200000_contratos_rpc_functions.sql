-- ============================================================================
-- Funciones RPC para contratos
-- ============================================================================

-- Función para que un miembro del grupo acepte un contrato de piso
CREATE OR REPLACE FUNCTION aceptar_contrato_piso_miembro(
    p_contrato_id UUID,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_grupo_id UUID;
    v_aceptaciones JSONB;
    v_total_miembros INTEGER;
    v_cuenta_aceptaciones INTEGER;
    v_contrato_estado TEXT;
BEGIN
    -- Obtener grupo_id y estado actual del contrato
    SELECT grupo_id, aceptaciones_miembros, estado
    INTO v_grupo_id, v_aceptaciones, v_contrato_estado
    FROM habitus_contratos_piso
    WHERE id = p_contrato_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contrato no encontrado';
    END IF;

    IF v_contrato_estado != 'pendiente_firma_grupos' THEN
        RAISE EXCEPTION 'Solo se pueden aceptar contratos en estado pendiente_firma_grupos';
    END IF;

    -- Verificar que el usuario es miembro del grupo
    IF NOT EXISTS (
        SELECT 1 FROM habitus_group_members
        WHERE group_id = v_grupo_id
        AND profile_id = p_user_id
        AND is_confirmed = true
    ) THEN
        RAISE EXCEPTION 'El usuario no es miembro activo del grupo';
    END IF;

    -- Agregar aceptación
    v_aceptaciones := COALESCE(v_aceptaciones, '{}'::jsonb);
    v_aceptaciones := v_aceptaciones || jsonb_build_object(p_user_id::text, NOW()::text);

    -- Contar miembros activos del grupo
    SELECT COUNT(*) INTO v_total_miembros
    FROM habitus_group_members
    WHERE group_id = v_grupo_id AND is_confirmed = true;

    -- Contar aceptaciones
    SELECT COUNT(*) INTO v_cuenta_aceptaciones FROM jsonb_object_keys(v_aceptaciones);

    -- Actualizar contrato
    UPDATE habitus_contratos_piso
    SET
        aceptaciones_miembros = v_aceptaciones,
        estado = CASE WHEN v_cuenta_aceptaciones >= v_total_miembros THEN 'activo' ELSE 'pendiente_firma_grupos' END
    WHERE id = p_contrato_id;

    -- Retornar resultado
    RETURN jsonb_build_object(
        'success', true,
        'aceptaciones', v_cuenta_aceptaciones,
        'total_miembros', v_total_miembros,
        'estado', CASE WHEN v_cuenta_aceptaciones >= v_total_miembros THEN 'activo' ELSE 'pendiente_firma_grupos' END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario
COMMENT ON FUNCTION aceptar_contrato_piso_miembro IS 'Registra la aceptación de un miembro del grupo a un contrato de piso y activa el contrato si todos aceptaron';
