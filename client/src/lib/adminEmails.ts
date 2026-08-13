const ADMIN_EMAILS = [
  import.meta.env.VITE_ADM_EMAIL_1,
  import.meta.env.VITE_ADM_EMAIL_2,
].filter(Boolean) as string[]

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email)
}
