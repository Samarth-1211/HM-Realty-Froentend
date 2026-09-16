import { Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'

export function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: { fontFamily: 'inherit', borderRadius: '0.75rem' },
        }}
      />
    </>
  )
}
