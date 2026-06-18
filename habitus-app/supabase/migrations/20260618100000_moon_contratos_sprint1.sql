-- ============================================================================
-- Contratos Moon: Sistema de contratos para habitaciones y pisos completos
-- ============================================================================
-- Sprint 1: Tablas base + RLS

-- 1. Contratos Anfitrión-Inquilino (Habitación)
CREATE TABLE IF NOT EXISTS habitus_contratos_habitacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habitacion_id UUID REFERENCES habitus_rooms(id) ON DELETE SET NULL,
    anfitrion_id UUID REFERENCES habitus_profiles(id) ON DELETE SET NULL,
    inquilino_id UUID REFERENCES habitus_profiles(id) ON DELETE SET NULL,

    -- Estado del contrato
    estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'pendiente_firma', 'activo', 'finalizado', 'cancelado')),

    -- Fechas
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,  -- NULL para contratos indefinidos

    -- Económicos
    renta_mensual NUMERIC(8,2) NOT NULL,
    fianza_meses INTEGER NOT NULL DEFAULT 2,

    -- Condiciones
    condiciones_especiales TEXT,

    -- PDF
    pdf_url TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES habitus_profiles(id),

    -- Constraints
    CHECK (renta_mensual > 0),
    CHECK (fianza_meses >= 0),
    CHECK (fecha_fin IS NULL OR fecha_fin > fecha_inicio)
);

-- Índices
CREATE INDEX idx_contratos_habitacion_anfitrion ON habitus_contratos_habitacion(anfitrion_id) WHERE estado != 'cancelado';
CREATE INDEX idx_contratos_habitacion_inquilino ON habitus_contratos_habitacion(inquilino_id) WHERE estado != 'cancelado';
CREATE INDEX idx_contratos_habitacion_habitacion ON habitus_contratos_habitacion(habitacion_id);
CREATE INDEX idx_contratos_habitacion_estado ON habitus_contratos_habitacion(estado);
CREATE INDEX idx_contratos_habitacion_fechas ON habitus_contratos_habitacion(fecha_inicio, fecha_fin);

-- 2. Contratos Propietario-Grupo (Piso completo)
CREATE TABLE IF NOT EXISTS habitus_contratos_piso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    piso_id UUID REFERENCES habitus_listings(id) ON DELETE SET NULL,
    propietario_id UUID REFERENCES habitus_profiles(id) ON DELETE SET NULL,
    grupo_id UUID REFERENCES habitus_groups(id) ON DELETE SET NULL,

    -- Estado del contrato
    estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'pendiente_firma_grupos', 'activo', 'finalizado', 'cancelado')),

    -- Fechas
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,

    -- Económicos
    renta_mensual NUMERIC(8,2) NOT NULL,
    fianza_total NUMERIC(8,2) NOT NULL,

    -- Distribución de renta por habitación (JSON: {hab_id: importe, ...})
    distribucion_renta JSONB,

    -- Condiciones
    condiciones_especiales TEXT,

    -- PDF
    pdf_url TEXT,

    -- Aceptaciones de miembros (JSON: {member_id: timestamp, ...})
    aceptaciones_miembros JSONB DEFAULT '{}'::jsonb,

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES habitus_profiles(id),

    -- Constraints
    CHECK (renta_mensual > 0),
    CHECK (fianza_total >= 0),
    CHECK (fecha_fin IS NULL OR fecha_fin > fecha_inicio)
);

-- Índices
CREATE INDEX idx_contratos_piso_propietario ON habitus_contratos_piso(propietario_id) WHERE estado != 'cancelado';
CREATE INDEX idx_contratos_piso_grupo ON habitus_contratos_piso(grupo_id);
CREATE INDEX idx_contratos_piso_listing ON habitus_contratos_piso(piso_id);
CREATE INDEX idx_contratos_piso_estado ON habitus_contratos_piso(estado);

-- 3. Gastos de Piso (para panel de propietario)
CREATE TABLE IF NOT EXISTS habitus_gastos_piso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    piso_id UUID REFERENCES habitus_listings(id) ON DELETE CASCADE,

    -- Descripción
    concepto TEXT NOT NULL,
    importe NUMERIC(8,2) NOT NULL,

    -- Tipo
    tipo TEXT NOT NULL CHECK (tipo IN ('fijo', 'variable', 'amortizacion')),
    periodicidad TEXT NOT NULL CHECK (periodicidad IN ('mensual', 'trimestral', 'anual', 'unico')),

    -- Fecha (para gastos únicos o referencia)
    fecha DATE NOT NULL,

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES habitus_profiles(id),

    CHECK (importe != 0)
);

-- Índices
CREATE INDEX idx_gastos_piso_piso ON habitus_gastos_piso(piso_id);
CREATE INDEX idx_gastos_piso_tipo ON habitus_gastos_piso(tipo);
CREATE INDEX idx_gastos_piso_fecha ON habitus_gastos_piso(fecha);

-- 4. Invitaciones a grupos (join requests)
CREATE TABLE IF NOT EXISTS habitus_group_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id UUID REFERENCES habitus_groups(id) ON DELETE CASCADE,
    solicitante_id UUID REFERENCES habitus_profiles(id) ON DELETE CASCADE,

    -- Mensaje del solicitante
    mensaje TEXT,

    -- Estado
    estado TEXT NOT NULL DEFAULT 'pending' CHECK (estado IN ('pending', 'approved', 'rejected', 'cancelled')),

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_by UUID REFERENCES habitus_profiles(id),
    responded_at TIMESTAMPTZ,

    -- La unicidad de solicitudes pendientes se aplica con un índice parcial.
    CONSTRAINT group_join_requests_estado_check CHECK (estado IN ('pending', 'approved', 'rejected', 'cancelled'))
);

-- Índices
CREATE INDEX idx_group_join_requests_grupo ON habitus_group_join_requests(grupo_id);
CREATE INDEX idx_group_join_requests_solicitante ON habitus_group_join_requests(solicitante_id);
CREATE INDEX idx_group_join_requests_estado ON habitus_group_join_requests(estado);
CREATE UNIQUE INDEX idx_group_join_requests_pending_unique
    ON habitus_group_join_requests(grupo_id, solicitante_id)
    WHERE estado = 'pending';

-- Enlaces de invitación (tokens únicos)
CREATE TABLE IF NOT EXISTS habitus_group_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id UUID REFERENCES habitus_groups(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,

    created_by UUID REFERENCES habitus_profiles(id),
    max_uses INTEGER NOT NULL DEFAULT 5,
    uses_count INTEGER NOT NULL DEFAULT 0,

    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (uses_count >= 0),
    CHECK (uses_count <= max_uses)
);

CREATE INDEX idx_group_invites_token ON habitus_group_invites(token);
CREATE INDEX idx_group_invites_grupo ON habitus_group_invites(grupo_id);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE habitus_contratos_habitacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE habitus_contratos_piso ENABLE ROW LEVEL SECURITY;
ALTER TABLE habitus_gastos_piso ENABLE ROW LEVEL SECURITY;
ALTER TABLE habitus_group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE habitus_group_invites ENABLE ROW LEVEL SECURITY;

-- RLS: Contratos habitación
-- Solo las partes involucradas (anfitrion, inquilino) pueden ver
CREATE POLICY "contratos_habitacion_select_partes"
    ON habitus_contratos_habitacion FOR SELECT
    USING (
        anfitrion_id = auth.uid() OR
        inquilino_id = auth.uid() OR
        created_by = auth.uid()
    );

CREATE POLICY "contratos_habitacion_insert_anfitrion"
    ON habitus_contratos_habitacion FOR INSERT
    WITH CHECK (anfitrion_id = auth.uid());

CREATE POLICY "contratos_habitacion_update_anfitrion"
    ON habitus_contratos_habitacion FOR UPDATE
    USING (anfitrion_id = auth.uid())
    WITH CHECK (anfitrion_id = auth.uid());

CREATE POLICY "contratos_habitacion_update_inquilino"
    ON habitus_contratos_habitacion FOR UPDATE
    USING (inquilino_id = auth.uid() AND estado = 'pendiente_firma')
    WITH CHECK (inquilino_id = auth.uid() AND estado = 'pendiente_firma');

-- RLS: Contratos piso
CREATE POLICY "contratos_piso_select_partes"
    ON habitus_contratos_piso FOR SELECT
    USING (
        propietario_id = auth.uid() OR
        created_by = auth.uid()
    );

-- Los miembros del grupo pueden ver contratos pendientes/activos
CREATE POLICY "contratos_piso_select_grupo_miembros"
    ON habitus_contratos_piso FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM habitus_group_members
            WHERE group_id = habitus_contratos_piso.grupo_id
            AND profile_id = auth.uid()
            AND is_confirmed = true
        )
    );

CREATE POLICY "contratos_piso_insert_propietario"
    ON habitus_contratos_piso FOR INSERT
    WITH CHECK (propietario_id = auth.uid());

CREATE POLICY "contratos_piso_update_propietario"
    ON habitus_contratos_piso FOR UPDATE
    USING (propietario_id = auth.uid())
    WITH CHECK (propietario_id = auth.uid());

CREATE POLICY "contratos_piso_accept_miembro"
    ON habitus_contratos_piso FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM habitus_group_members
            WHERE group_id = habitus_contratos_piso.grupo_id
            AND profile_id = auth.uid()
            AND is_confirmed = true
        )
    );

-- RLS: Gastos piso
CREATE POLICY "gastos_piso_select_propietario"
    ON habitus_gastos_piso FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM habitus_listings
            WHERE id = habitus_gastos_piso.piso_id
            AND owner_profile_id = auth.uid()
        )
    );

CREATE POLICY "gastos_piso_insert_propietario"
    ON habitus_gastos_piso FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM habitus_listings
            WHERE id = habitus_gastos_piso.piso_id
            AND owner_profile_id = auth.uid()
        )
    );

CREATE POLICY "gastos_piso_update_propietario"
    ON habitus_gastos_piso FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM habitus_listings l
            JOIN habitus_gastos_piso gp ON gp.piso_id = l.id
            WHERE gp.id = habitus_gastos_piso.id
            AND l.owner_profile_id = auth.uid()
        )
    );

CREATE POLICY "gastos_piso_delete_propietario"
    ON habitus_gastos_piso FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM habitus_listings l
            WHERE l.id = habitus_gastos_piso.piso_id
            AND l.owner_profile_id = auth.uid()
        )
    );

-- RLS: Group join requests
CREATE POLICY "group_join_requests_select_grupo"
    ON habitus_group_join_requests FOR SELECT
    USING (
        -- Líder del grupo ve todas las requests
        EXISTS (
            SELECT 1 FROM habitus_groups
            WHERE id = habitus_group_join_requests.grupo_id
            AND creator_id = auth.uid()
        )
        OR
        -- El solicitante ve su propia request
        solicitante_id = auth.uid()
    );

CREATE POLICY "group_join_requests_insert_solicitante"
    ON habitus_group_join_requests FOR INSERT
    WITH CHECK (solicitante_id = auth.uid());

CREATE POLICY "group_join_requests_update_leader"
    ON habitus_group_join_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM habitus_groups
            WHERE id = habitus_group_join_requests.grupo_id
            AND creator_id = auth.uid()
        )
    );

-- RLS: Group invites
CREATE POLICY "group_invites_select_anyone"
    ON habitus_group_invites FOR SELECT
    USING (expires_at > NOW());

CREATE POLICY "group_invites_insert_leader"
    ON habitus_group_invites FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM habitus_groups
            WHERE id = habitus_group_invites.grupo_id
            AND creator_id = auth.uid()
        )
    );

CREATE POLICY "group_invites_update_leader"
    ON habitus_group_invites FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM habitus_groups
            WHERE id = habitus_group_invites.grupo_id
            AND creator_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM habitus_groups
            WHERE id = habitus_group_invites.grupo_id
            AND creator_id = auth.uid()
        )
    );

CREATE POLICY "group_invites_delete_leader"
    ON habitus_group_invites FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM habitus_groups
            WHERE id = habitus_group_invites.grupo_id
            AND creator_id = auth.uid()
        )
    );

-- ============================================================================
-- Funciones helper
-- ============================================================================

-- Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_contratos_habitacion_updated_at
    BEFORE UPDATE ON habitus_contratos_habitacion
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contratos_piso_updated_at
    BEFORE UPDATE ON habitus_contratos_piso
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_join_requests_updated_at
    BEFORE UPDATE ON habitus_group_join_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper: Verificar si todos los miembros del grupo han aceptado
CREATE OR REPLACE FUNCTION check_grupo_todos_aceptaron(p_contrato_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    p_grupo_id UUID;
    total_miembros INTEGER;
    aceptaciones JSONB;
    cuenta_aceptaciones INTEGER;
BEGIN
    SELECT grupo_id, aceptaciones_miembros
    INTO p_grupo_id, aceptaciones
    FROM habitus_contratos_piso
    WHERE id = p_contrato_id;

    -- Contar miembros activos del grupo
    SELECT COUNT(*) INTO total_miembros
    FROM habitus_group_members
    WHERE group_id = p_grupo_id AND is_confirmed = true;

    -- Contar aceptaciones
    cuenta_aceptaciones := (SELECT COUNT(*) FROM jsonb_object_keys(COALESCE(aceptaciones, '{}'::jsonb)));

    RETURN cuenta_aceptaciones >= total_miembros;
END;
$$ LANGUAGE plpgsql;

-- Helper: Crear historial de cambios de estado
CREATE OR REPLACE FUNCTION log_estado_cambio()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo para cambios de estado
    IF (TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado) THEN
        INSERT INTO contrato_estado_log (contrato_tipo, contrato_id, estado_anterior, estado_nuevo, cambiado_por, cambiado_at)
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
$$ LANGUAGE plpgsql;

-- Tabla de log de estados (para auditoría)
CREATE TABLE IF NOT EXISTS contrato_estado_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_tipo TEXT NOT NULL, -- 'habitacion' o 'piso'
    contrato_id UUID NOT NULL,
    estado_anterior TEXT,
    estado_nuevo TEXT NOT NULL,
    cambiado_por UUID REFERENCES habitus_profiles(id),
    cambiado_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contrato_estado_log_contrato ON contrato_estado_log(contrato_tipo, contrato_id);
CREATE INDEX idx_contrato_estado_log_fecha ON contrato_estado_log(cambiado_at);

-- Triggers para log de estados
CREATE TRIGGER log_contratos_habitacion_estado
    BEFORE UPDATE ON habitus_contratos_habitacion
    FOR EACH ROW EXECUTE FUNCTION log_estado_cambio();

CREATE TRIGGER log_contratos_piso_estado
    BEFORE UPDATE ON habitus_contratos_piso
    FOR EACH ROW EXECUTE FUNCTION log_estado_cambio();

-- ============================================================================
-- Comentarios
-- ============================================================================

COMMENT ON TABLE habitus_contratos_habitacion IS 'Contratos entre anfitriones e inquilinos para habitaciones individuales';
COMMENT ON TABLE habitus_contratos_piso IS 'Contratos entre propietarios y grupos para pisos completos';
COMMENT ON TABLE habitus_gastos_piso IS 'Gastos asociados a un piso para cálculo de ingresos netos del propietario';
COMMENT ON TABLE habitus_group_join_requests IS 'Solicitudes para unirse a un grupo existente';
COMMENT ON TABLE habitus_group_invites IS 'Enlaces de invitación únicos para reclutar miembros a un grupo';
