// Brevo (formerly Sendinblue) Integration
// Sincronización con CRM

export interface BrevoContact {
  id: number
  email: string
  attributes: {
    FIRSTNAME?: string
    LASTNAME?: string
    PHONE?: string
    CITY?: string
    LEAD_TYPE?: 'anfitrion' | 'propietario' | 'agencia'
    SOURCE?: string
  }
  listIds: number[]
}

export interface BrevoList {
  id: number
  name: string
  numberOfSubscribers: number
}

// Sincronizar lead con Brevo
export async function syncToBrevo(contact: {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  city?: string
  type: string
  source: string
}): Promise<BrevoContact> {
  // TODO: POST https://api.brevo.com/v3/contacts
  // Configurar listas: Anfitriones (ID: 1), Propietarios (ID: 2), Agencias (ID: 3)

  return {} as BrevoContact
}

// Obtener estadísticas de listas
export async function getBrevoStats(): Promise<BrevoList[]> {
  // TODO: GET https://api.brevo.com/v3/lists
  return []
}

// Actualizar atributos de contacto
export async function updateBrevoContact(email: string, attributes: Record<string, any>) {
  // TODO: PUT https://api.brevo.com/v3/contacts/{email}
}
