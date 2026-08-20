import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAutenticacao } from '../contextos/ContextoAutenticacao'

const linkClasse = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`

export function Layout({ children }: { children: ReactNode }) {
  const { usuario, sair } = useAutenticacao()
  const navegar = useNavigate()

  function aoSair() {
    sair()
    navegar('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold text-slate-900">Gerenciador Financeiro</span>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={linkClasse}>
              Painel
            </NavLink>
            <NavLink to="/transacoes" className={linkClasse}>
              Transações
            </NavLink>
            <NavLink to="/categorias" className={linkClasse}>
              Categorias
            </NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{usuario?.nome}</span>
            <button
              onClick={aoSair}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
