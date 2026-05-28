# Plantillas Brevo — moonsharedliving.com

Dominio remitente verificado: `noreply@moonsharedliving.com`  
Nombre remitente: `: moon shared living`

> **Implementación actual:** el API `/api/notify/event` envía HTML transaccional inline vía Brevo SMTP API (`/v3/smtp/email`). Las plantillas siguientes documentan el copy y CTA por evento; opcionalmente puedes migrarlas a plantillas Brevo (`templateId`) más adelante.

## Verificación de dominio

1. Brevo → **Senders, Domains & Dedicated IPs** → **Domains**
2. Añadir `moonsharedliving.com`
3. Publicar registros DNS: SPF, DKIM, DMARC (Brevo los genera)
4. Verificar dominio antes de producción
5. Configurar remitente `noreply@moonsharedliving.com`

## Variables de entorno (Vercel)

```env
BREVO_API_KEY=
BREVO_SENDER_EMAIL=noreply@moonsharedliving.com
BREVO_SENDER_NAME=: moon shared living
```

---

## 1. Nueva solicitud (→ propietario / anfitrión)

| Campo | Valor |
|-------|-------|
| **Asunto** | Nueva solicitud para {{listing_name}} |
| **Preheader** | {{applicant_name}} quiere alquilar tu espacio |
| **CTA** | Revisar solicitudes → `https://www.moonsharedliving.com/panel/solicitudes` |

**Cuerpo:**

> **Nueva solicitud de alquiler**  
> {{applicant_name}} ha solicitado **{{listing_name}}**.  
> Revisa la solicitud y responde cuanto antes para no perder al candidato.

---

## 2. Confirmación solicitud (→ inquilino)

| Campo | Valor |
|-------|-------|
| **Asunto** | Solicitud enviada — {{listing_name}} |
| **Preheader** | Hemos registrado tu solicitud |
| **CTA** | Ver mi perfil → `https://www.moonsharedliving.com/profile` |

**Cuerpo:**

> **Solicitud registrada**  
> Tu solicitud para **{{listing_name}}** está en revisión.  
> Te avisaremos por push, email y en la app cuando haya novedades.

---

## 3. Cambio estado solicitud

| Campo | Valor |
|-------|-------|
| **Asunto** | Actualización: {{listing_name}} |
| **Preheader** | Estado: {{status_label}} |
| **CTA** | Ver solicitud → `https://www.moonsharedliving.com/profile` |

**Cuerpo:**

> **Actualización de tu solicitud**  
> **{{listing_name}}**: {{status_label}}  
> Entra en tu perfil para ver los siguientes pasos.

---

## 4. Nuevo mensaje

| Campo | Valor |
|-------|-------|
| **Asunto** | Mensaje de {{sender_name}} |
| **Preheader** | {{message_preview}} |
| **CTA** | Responder → `https://www.moonsharedliving.com/messages?c={{conversation_id}}` |

**Cuerpo:**

> **Nuevo mensaje**  
> **{{sender_name}}** te escribió:  
> «{{message_preview}}»

Solo se envía si `email_messages = true` en preferencias del usuario.

---

## 5. Actividad de grupo (join / acceso privado)

### 5a Solicitud unirse (→ leads)

| Campo | Valor |
|-------|-------|
| **Asunto** | Solicitud para {{group_name}} |
| **CTA** | `https://www.moonsharedliving.com/grupos/{{group_slug}}` |

### 5b Aceptación / rechazo (→ solicitante)

| Asunto aceptación | ¡Te han aceptado en {{group_name}}! |
| Asunto rechazo | Solicitud de grupo — {{group_name}} |

### 5c Acceso piso privado (→ miembros)

| Campo | Valor |
|-------|-------|
| **Asunto** | Piso privado desbloqueado |
| **CTA** | `https://www.moonsharedliving.com/descubrir` |

---

## Footer legal (todas)

> Email transaccional de moonsharedliving.com.  
> Gestiona tus preferencias en **Perfil → Notificaciones**.  
> No incluye emails de marketing.

---

## Smoke test post-configuración

1. Enviar solicitud de prueba → propietario recibe email con asunto «Nueva solicitud…»
2. Inquilino recibe confirmación
3. Cambiar estado → email al inquilino
4. Mensaje con `email_messages` activo → email con preview
5. Desactivar `email_messages` → solo push + in-app para chat
