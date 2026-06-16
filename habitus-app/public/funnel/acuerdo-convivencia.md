# ACUERDO DE CONVIVENCIA — Plantilla moon

> **moon · el sistema operativo de los pisos compartidos**
> Plantilla orientativa para regular la convivencia entre quienes comparten un piso. **No es un contrato de arrendamiento** (moon nunca es parte del alquiler) ni sustituye la asesoría legal de un abogado español; es un pacto entre convivientes para evitar el 90% de los conflictos. Rellena los campos `[...]` y firmadlo (la firma digital en moon vale como aceptación).

---

## 1. Partes y vivienda

- **Vivienda:** `[dirección completa, piso, puerta]`, `[barrio]`, `[ciudad]`.
- **Contrato de arrendamiento principal:** a nombre de `[titular/figura]`, con duración `[…]`. Este acuerdo se extingue con el contrato principal.
- **Convivientes (firmantes):**

| Nombre | DNI/NIE | Habitación | Rol en moon |
|---|---|---|---|
| `[Nombre 1]` | `[…]` | `[Habitación, m² aprox]` | Lead / Miembro |
| `[Nombre 2]` | `[…]` | `[…]` | Miembro |
| `[Nombre 3]` | `[…]` | `[…]` | Miembro |

> **moon:** cada conviviente tiene su perfil verificado (`IdentityBadge`) y su **Moon Score**. Este acuerdo se asocia al grupo de convivencia `[slug del grupo en moon]`.

## 2. Duración y entrada/salida

- **Vigencia:** desde `[fecha]` hasta la finalización del contrato principal o la salida de un conviviente, lo que ocurra antes.
- **Preaviso de salida:** `[30]` días mínimos. El conviviente que sale debe dejar la habitación en el estado acordado y participar en la **liquidación de gastos** (moon Gastos → `computeSuggestedTransfers`).
- **Nuevo conviviente:** requiere acuerdo de la mayoría. Debe crear perfil moon, verificarse y aceptar este acuerdo antes de entrar.

## 3. Reparto de gastos (moon Gastos)

Usamos **moon Gastos** como única fuente de verdad del dinero del piso. Reglas:

- **Alquiler:** se reparte según habitación (`proportional` por m²/valor en moon Gastos), **no a partes iguales**, salvo que las habitaciones sean equivalentes. Método acordado: `[equal / proportional / custom]`.
- **Suministros** (luz, agua, gas, internet): a partes iguales, registrados en moon Gastos, pagados por `[quién]` y repartidos automáticamente.
- **Comunes** (papel higiénico, limpieza, productos): a partes iguales; rotación de compra o bote común de `[X] €/mes`.
- **Privados** (comida personal, gustos): cada uno lo suyo. No se reparten.
- **Liquidación:** al final de cada mes y a la salida de cualquier conviviente, se cuadran saldos con `computeSuggestedTransfers` (mínimo de transferencias). Se registra el pago en moon (`recordSettlement`).
- **Principio:** *nadie debe dinero a nadie al terminar el mes.* Si alguien acumula deuda `[>]` de `[X] €` sin cuadrar, se abre conversación inmediata.

## 4. Normas de convivencia

- **Limpieza:** rotación semanal de zonas comunes (cocina, baño, salón, basura). Calendario en moon. Zonas comunes se dejan recogidas tras el uso.
- **Ruido y descanso:** silencio relativo de `[23:00]` a `[08:00]`. Sin música/calls altas en zonas comunes en ese tramo. Las fiestas con invitados requieren aviso `[24]` h antes y acuerdo.
- **Zonas comunes vs privadas:** la habitación es espacio privado e inviolable. Las zonas comunes son de todos.
- **Visitas y huéspedes:** estancias de `[<3]` noches OK con aviso. Más días o dormir regularmente a alguien: se reparte su parte de suministros y se avisa al grupo.
- **Mascotas:** `[permitidas / no]`. Si se permiten, el dueño responde de daños y limpieza.
- **Fumar:** `[no dentro del piso]`.
- **Llaves y seguridad:** cada uno con su llave; no se deja entrar a desconocidos.

## 5. Mantenimiento e incidencias (botón de incidencias de moon)

- **Cualquier avería o incidencia** (electrodoméstico roto, fuga, caldería, cerradura, plaga) se **reporta en el grupo de moon** con el botón **"Reportar incidencia"**: tipo, urgencia y descripción.
- **Urgencias de seguridad** (fuga de gas, eléctrica, agua): llamar primero al `[112 / compañía suministradora]`, luego reportar. moon no es un servicio de emergencia.
- **Reparaciones menores (<[50] €):** las decide y paga el grupo, repartidas en moon Gastos.
- **Reparaciones mayores:** responsabilidad del `[titular/propietario]`. El lead contacta; el resto aporta pruebas (foto + fecha) desde el historial de incidencias de moon.
- **Principio:** *todo incidente queda registrado.* Un historial limpio y bien gestionado alimenta el **Moon Score** del grupo; lo contrario, también.

## 6. Privacidad, respeto y resolución de conflictos

- **Respeto cero** a chistes o comportamientos racistas, sexistas, machistas, capacitistas o acosadores. Un solo incidente grave puede suponer expulsión del grupo con preaviso reducido.
- **Resolución por escalado:** (1) hablar directamente entre las partes → (2) reunión de grupo con el lead → (3) mediación externa. El Moon Score y el historial de incidencias son referencias objetivas, no verdades absolutas.
- **Privacidad de datos:** lo que se comparte en moon (gastos, incidencias, hábitos) se queda en el grupo. No se difunde fuera.

## 7. Fin del acuerdo

- Por finalización del contrato principal, salida de un conviviente, o acuerdo de la mayoría.
- Cierre: liquidación final en moon Gastos, inventario de la habitación, y —si la convivencia fue buena— **endoso mutuo** en moon (alimenta el Moon Score portable de cada uno para su próximo piso).

---

## Aceptación

Al aceptar este acuerdo en el grupo de moon, cada conviviente confirma haberlo leído y comprometerse a cumplirlo. La aceptación digital en moon equivale a firma.

| Conviviente | Fecha | Aceptación (moon) |
|---|---|---|
| `[Nombre 1]` | `[fecha]` | ✓ verificado |
| `[Nombre 2]` | `[fecha]` | ✓ verificado |
| `[Nombre 3]` | `[fecha]` | ✓ verificado |

---

*moon — convivir bien, sin humo. Plantilla v1 · `[fecha]`. Revisión jurídica recomendada antes de uso formal.*
