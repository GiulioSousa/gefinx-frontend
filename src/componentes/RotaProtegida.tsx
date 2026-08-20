import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAutenticacao } from '../contextos/ContextoAutenticacao'

export function RotaProtegida({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAutenticacao()

  if (carregando) {
    return null
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
