export interface CheckinGuest {
  id: number
  name: string
  status: 'Aguardando' | 'Presente' | 'Saiu'
  walkedIn: boolean
  guestType: string
  checkin_at: string | null
  checkout_at?: string | null
}
