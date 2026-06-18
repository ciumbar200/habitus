# Lista de Implementación - Moon Contratos y Finanzas

**Generado**: 2026-06-18
**Features faltantes**: 5

**Actualizado por Codex**: 2026-06-18
**Estado actual**: Sprint 1-4 funcional cerrado a nivel de tablas, servicios core, rutas, pantallas básicas, PDF operativo, endpoints serverless, notificaciones transaccionales y CRUD de gastos. Queda endurecimiento legal/UX y despliegue controlado de migraciones.

---

## Prioridad ALTA 🔴

### 1. Sistema de Contratos

**Estado**: IMPLEMENTADO FUNCIONAL

#### 1.1 Contrato Anfitrión-Inquilino (Habitación)

**Flujo de usuario**:
1. Anfitrión ve lista de interesados en su habitación
2. Anfitrión selecciona inquilino y hace "oferta de contrato"
3. Inquilino recibe notificación y revisa términos
4. Inquilino acepta/rechaza
5. Sistema genera contrato PDF
6. Ambas partes firman digitalmente
7. Contrato activo → ingresa al panel de gestiones

**Backend - Nueva tabla**:
- habitus_contratos_habitacion
  - id (uuid, primary key)
  - habitacion_id (uuid, references habitus_rooms)
  - anfitrion_id (uuid, references habitus_profiles)
  - inquilino_id (uuid, references habitus_profiles)
  - estado (enum: borrador, pendiente_firma, activo, finalizado, cancelado)
  - fecha_inicio (date)
  - fecha_fin (date, nullable)
  - renta_mensual (decimal(8,2))
  - fianza_meses (int, default 2)
  - condiciones_especiales (text)
  - pdf_url (text)
  - created_at (timestamp)

**API endpoints**:
- POST /api/contratos/habitacion - Crear borrador
- PUT /api/contratos/habitacion/:id/ofertar - Ofertar a inquilino
- PUT /api/contratos/habitacion/:id/aceptar - Inquilino acepta
- PUT /api/contratos/habitacion/:id/rechazar - Inquilino rechaza
- GET /api/contratos/habitacion/:id/pdf - Generar PDF

**Frontend pages**:
- /panel/anfitriones/contratos - Lista de contratos
- /panel/contratos/:id - Detalle y firma
- /panel/anfitriones/contratos/nuevo - Crear borrador

#### 1.2 Contrato Propietario-Grupo (Piso completo)

**Flujo de usuario**:
1. Propietario ve aplicaciones de grupos a su piso
2. Propietario selecciona grupo y hace "oferta de contrato"
3. Líder del grupo recibe notificación
4. Líder comparte contrato con miembros del grupo
5. Todos los miembros aceptan (100% requerido)
6. Sistema genera contrato PDF firmado por todos
7. Contrato activo → piso ocupado

**Backend - Nueva tabla**:
- habitus_contratos_piso
  - id (uuid, primary key)
  - piso_id (uuid, references habitus_listings)
  - propietario_id (uuid, references habitus_profiles)
  - grupo_id (uuid, references habitus_groups)
  - estado (enum: borrador, pendiente_firma_grupos, activo, finalizado, cancelado)
  - fecha_inicio (date)
  - fecha_fin (date, nullable)
  - renta_mensual (decimal(8,2))
  - fianza_total (decimal(8,2))
  - distribucion_renta (jsonb: habitacion_id → importe)
  - condiciones_especiales (text)
  - pdf_url (text)
  - aceptaciones_miembros (jsonb: member_id → timestamp)
  - created_at (timestamp)

**API endpoints**:
- POST /api/contratos/piso - Crear borrador
- PUT /api/contratos/piso/:id/ofertar - Ofertar a grupo
- PUT /api/contratos/piso/:id/aceptar - Miembro acepta
- PUT /api/contratos/piso/:id/rechazar - Miembro rechaza
- GET /api/contratos/piso/:id/pdf - Generar PDF

**Frontend pages**:
- /panel/propietarios/contratos - Lista de contratos
- /panel/propietarios/contratos/:id - Detalle y seguimiento
- /panel/grupos/:id/contrato - Vista del grupo para revisar/firmar
- /panel/propietarios/contratos/nuevo - Crear borrador

### 2. Panel de Ingresos y Presupuesto (Propietario)

**Estado**: IMPLEMENTADO FUNCIONAL

#### 2.1 Dashboard de Ingresos

**Métricas principales**:
- Ingresos mensuales actuales (€)
- Ingresos proyectados (mes, trimestre, año)
- Ocupación (%)
- Rentas pendientes de cobro
- Próximos vencimientos

**Gráficos**:
- Gráfico de ingresos últimos 12 meses
- Gráfico de ocupación por piso
- Timeline de contratos (vigentes, próximos a vencer)

**Backend**:
- Nueva view materializada: propietario_ingresos_mv

**API endpoints**:
- GET /api/propietarios/ingresos - Métricas principales
- GET /api/propietarios/ingresos/historico - Datos para gráficos
- GET /api/propietarios/contratos-activos - Lista de contratos

**Frontend pages**:
- /panel/propietarios - Dashboard principal
- /panel/propietarios/ingresos - Vista detallada
- /panel/propietarios/contratos - Gestión de contratos

#### 2.2 Gastos

**Backend - Nueva tabla**:
- habitus_gastos_piso
  - id (uuid, primary key)
  - piso_id (uuid, references habitus_listings)
  - concepto (text)
  - importe (decimal(8,2))
  - tipo (enum: fijo, variable, amortizacion)
  - periodicidad (enum: mensual, trimestral, anual, unico)
  - fecha (date)
  - created_at (timestamp)

**API endpoints**:
- GET /api/propietarios/gastos/:pisoId - Gastos de un piso
- POST /api/propietarios/gastos - Añadir gasto
- PUT /api/propietarios/gastos/:id - Editar gasto
- DELETE /api/propietarios/gastos/:id - Borrar gasto

### 3. Invitación a Grupos

**Estado**: IMPLEMENTADO FUNCIONAL

**Backend - Nuevas tablas**:
- habitus_group_invites
  - id (uuid, primary key)
  - grupo_id (uuid, references habitus_groups)
  - token (text, unique)
  - created_by (uuid, references habitus_profiles)
  - expires_at (timestamp)
  - max_uses (int, default 5)
  - created_at (timestamp)

- habitus_group_join_requests
  - id (uuid, primary key)
  - grupo_id (uuid, references habitus_groups)
  - solicitante_id (uuid, references habitus_profiles)
  - mensaje (text)
  - estado (enum: pending, approved, rejected)
  - created_at (timestamp)

**API endpoints**:
- POST /api/grupos/:id/invitar - Generar enlace invitación
- POST /api/grupos/join/:token - Solicitar unirse vía enlace
- POST /api/grupos/:id/solicitar - Solicitar unirse directamente
- PUT /api/grupos/:grupo_id/miembros/:solicitante_id - Aprobar/rechazar

**Frontend**:
- Modal "Invitar miembros" en página de grupo
- Página pública /grupos/join/:token para candidatos
- Sección de solicitudes pendientes en detalle de grupo

---

## Prioridad MEDIA 🟡

### 4. Generación de PDFs

**Estado**: IMPLEMENTADO BÁSICO

Usar librería como pdf-lib o jspdf para generar contratos PDF legales.

**Template**:
- Header con logo Moon
- Título del contrato
- Datos de las partes
- Cláusulas numeradas
- Footer con fecha y espacio para firmas

**Firma digital**:
- Simple checkbox "Acepto los términos" + timestamp
- Opcional: Integración con DocuSign

### 5. Notificaciones

**Estado**: IMPLEMENTADO BÁSICO

- Email al ofertar contrato
- Email al aceptar/rechazar
- Email al activar contrato
- Push notifications en la app

### 6. Máquina de Estados

**Estado**: IMPLEMENTADO BÁSICO

**Estados de contrato**:
- Borrador → Pendiente Firma → Activo → Finalizado/Cancelado

Cada transición dispara notificaciones y actualizaciones.

---

## Orden Sugerido de Implementación

**Sprint 1** (2 semanas):
- Tablas habitus_contratos_habitacion y habitus_contratos_piso
- API endpoints básicos
- Pages de lista de contratos

**Sprint 2** (2 semanas):
- Flujo completo anfitrión-inquilino
- Flujo completo propietario-grupo
- Generación de PDFs básica

**Sprint 3** (1 semana):
- Panel de ingresos propietario
- Dashboard con métricas

**Sprint 4** (1 semana):
- Invitación a grupos
- Notificaciones

**Total estimado**: 6 semanas

---

## Notas Técnicas

- **Seguridad**: RLS para contratos (solo partes involucradas)
- **Audit trail**: Registrar quién y cuándo en cada cambio de estado
- **Versionado**: Guardar versiones de contratos si se modifican
- **Legal**: Templates deben ser revisados por abogado
