import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { authApi, type LoginPayload } from '@/api/auth.api'
import { extractErrorMessage } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth-store'
import { ROLE_LABELS } from '@/lib/constants'

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      setSession(data)
      toast.success(`Welcome back, ${data.user.firstName}`, {
        description: `Signed in as ${ROLE_LABELS[data.user.role]}`,
      })
      navigate({ to: '/dashboard' })
    },
    onError: (error) => {
      toast.error('Sign in failed', { description: extractErrorMessage(error) })
    },
  })
}

export function useSuperAdminLogin() {
  const setSession = useAuthStore((s) => s.setSession)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.superAdminLogin(payload),
    onSuccess: (data) => {
      setSession(data)
      toast.success(`Welcome back, ${data.user.firstName}`, {
        description: `Signed in as ${ROLE_LABELS[data.user.role]}`,
      })
      navigate({ to: '/dashboard' })
    },
    onError: (error) => {
      toast.error('Sign in failed', { description: extractErrorMessage(error) })
    },
  })
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onError: (error) => {
      toast.error('Could not send reset code', { description: extractErrorMessage(error) })
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: { email: string; otp: string; newPassword: string }) => authApi.resetPassword(payload),
    onError: (error) => {
      toast.error('Could not reset password', { description: extractErrorMessage(error) })
    },
  })
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async () => {
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => undefined)
      }
    },
    onSettled: () => {
      clearSession()
      navigate({ to: '/login' })
    },
  })
}
