import { toast } from 'sonner'
import type { EmailDeliveryStatus } from '@/types'

/**
 * Shows the success toast, replacing it with a warning when the invite email
 * could not be delivered so the operator knows to hand over the temporary
 * password another way (or retry via "Resend verification").
 */
export function toastWithEmailDelivery(
  result: { emailDelivery?: EmailDeliveryStatus } | undefined,
  successMessage: string,
) {
  const delivery = result?.emailDelivery

  if (delivery && !delivery.sent) {
    toast.warning(`${successMessage}, but the invite email was not sent`, {
      description: `${delivery.error ?? 'Email delivery failed.'} Share the temporary password directly, then use "Resend verification" once email is working.`,
      duration: 12000,
    })
    return
  }

  toast.success(successMessage)
}
