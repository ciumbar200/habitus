# 🌙 moon — Dashboard de ejecución · 14 días

> Objetivo de la quincena: pasar de "app vacía con datos seed" a **2-3 pisos reales gestionando su convivencia en moon** (gastos + incidencias + acuerdo), con el bucle convivencia→Moon Score cerrado y el primer material de funnel en la calle. Todo €0. Cada día: un output dueño medible.

**Principio rector:** no se construye nada que no cablee al moat (Gastos → Incidencias → Acuerdo → Endoso → Moon Score). Más features sueltas = humo.

---

## Semana 1 — El producto interno de la convivencia (que un piso funcione solo)

### Día 1 — Incidencias (backend)
- **Output:** migration `habitus_group_incidents` + service `incidents.ts` + tipos. RLS: solo miembros confirmados del grupo.
- **Dueño:** dev. Señal: tabla creada, `fetchGroupIncenses` funciona.

### Día 2 — Incidencias (UI) + revisar "solicitar unirse"
- **Output:** `GroupIncidentsPanel` en `GroupDetailPage` (botón "Reportar incidencia": lavadora, fuga, etc., con severidad). Verificar que el botón "Solicitar unirse" se ve para no-miembros en grupos `forming`.
- **Dueño:** dev. Señal: un miembro reporta y resuelve una incidencia end-to-end.

### Día 3 — moon Gastos como puerta de entrada
- **Output:** entrada standalone a Gastos (`/gastos` o CTA visible sin pasar por group/matching). Un piso nuevo entra directo a repartir gastos.
- **Dueño:** dev. Señal: onboarding de un piso en <3 min sin tocar matching.

### Día 4 — UX perfecta del dinero
- **Output:** añadir gasto en 1 toque, sugerencias, vista clara "te debe / debes", settle-up con chip del Moon Score del compañero.
- **Dueño:** dev. Señal: 1 conviviente invita a otro vía un gasto (bucle viral vivo).

### Día 5 — Endoso (cerrar el bucle reputación)
- **Output:** UI de endoso: tras convivencia, mini-form (4 sliders + "¿repetirías?") → `submitEndorsement` → Moon Score sube.
- **Dueño:** dev. Señal: 1 endoso real dispara recalculo del Moon Score.

### Día 6 — Cable Moon Score ← evidencia objetiva
- **Output:** la función `habitus_compute_moon_score` suma señal real (convivencias sin incidencias graves / settlements registrados), no solo opinión. + espejo TS.
- **Dueño:** dev. Señal: un perfil con convivencia limpia sube Score sin endoso manual.

### Día 7 — Acuerdo de convivencia integrado
- **Output:** el `acuerdo-convivencia.md` (ya generado) como plantilla rellenable + aceptación digital en el grupo. Lead lo activa; miembros aceptan.
- **Dueño:** dev. Señal: 1 grupo firma el acuerdo en moon.

---

## Semana 2 — Funnel, adquisición y operadores (salir a la calle)

### Día 8 — Funnel: calculadora de alquiler justo (live)
- **Output:** página pública `/calcular-alquiler-justo` con la lógica de `computeFairSplit`. Captura email. (Tu "no hay calculadora en condiciones" → resuelto.)
- **Dueño:** dev. Señal: calculadora funciona y deja email.

### Día 9 — Funnel: PDFs descargables
- **Output:** Acuerdo de convivencia + Guía de convivir en [barrio] + Plantilla de inventario como PDFs descargables (lead magnets).
- **Dueño:** dev/contenido. Señal: 3 PDFs públicos, capturando email.

### Día 10 — Campo: sembrar 2-3 pisos reales (Poblenou)
- **Output:** founder picha moon Gastos a 2-3 pisos reales (red + Telegram). **No** pichas "busca compañero". El dinero rompe el cold-start.
- **Dueño:** ciumbar. Señal: 2-3 grupos `active` con gastos reales (no demo).

### Día 11 — Contenido orgánico (SEO programático batch 1)
- **Output:** 5-10 páginas programáticas ciudad×barrio + 2 posts de blog ("repartir alquiler justo con habitaciones distintas", "liquidar un piso sin pelearte") generados por los agentes IA.
- **Dueño:** dev/contenido. Señal: indexadas en Search Console.

### Día 12 — Social orgánico (dolor compartible)
- **Output:** 3 Reels/TikTok de dolor de convivencia + Moon Score share cards ("soy 87/100, verificado en moon").
- **Dueño:** ciumbar. Señal: 1 contenido compartido orgánicamente.

### Día 13 — Operadores: MVP de "ocupación verificada"
- **Output:** spec + landing B2B `/operadores`: "ocupación verificada + señal de calidad + gestión de incidencias" para operadores de co-living. 1 conversación abierta con un operador real.
- **Dueño:** ciumbar + dev. Señal: 1 demo agendada con operador.

### Día 14 — Medir y decidir (keep/kill)
- **Output:** contra los kill criteria: ¿los 2-3 pisos invitan gente + generan endosos? ¿retienen al cerrar convivencia? ¿la calculadora/PDF capturan emails? Decidir qué amplificar, qué matar.
- **Dueño:** ciumbar. Señal: decisión comprometida de la jugada de la siguiente quincena.

---

## Métricas norte (las que importan, no vanity)
- **Convivencias reales activas en moon** (gastos + incidencias usándose, no registros vacíos).
- **Bucle viral:** invitaciones a moon desde un gasto repartido (K-factor).
- **Endosos reales** generados (el moat creciendo).
- **Retención post-convivencia:** usuarios que no se borran al liquidar (cuidan su Score).
- **Funnel:** emails capturados vía calculadora/PDFs.
- **Operadores:** demos agendadas (la vía de ingresos).

## Kill criteria de la quincena
- Si a día 14 los 2-3 pisos sembrados **no invitan a nadie ni generan endosos** → moon Gastos no es sticky: pivotar wedge.
- Si los usuarios se borran al terminar convivencia → la reputación portable no se percibe como activo: reforzar Moon Score antes de crecer.
- Si la calculadora/PDF no capturan emails en 7 días → el dolor de funnel no es el asumido: re-pivotar el mensaje.

---
_moon · OS de la convivencia · €0 · sin humo · v1 2026-06-17_
