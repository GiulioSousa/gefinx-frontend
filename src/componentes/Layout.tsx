import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAutenticacao } from '../contextos/ContextoAutenticacao'
import { encerrarTodasAsSessoes } from '../api/sessoesApi'
import { extrairMensagemErro } from '../api/erros'

const linkClasse = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`

export function Layout({ children }: { children: ReactNode }) {
  const { usuario, sair } = useAutenticacao()
  const navegar = useNavigate()
  const [encerrando, setEncerrando] = useState(false)
  const [erro, setErro] = useState('')

  function aoSair() {
    sair()
    navegar('/login')
  }

  async function aoEncerrarTodas() {
    const confirmado = window.confirm(
      'Isto vai desconectar você de todos os aparelhos, inclusive deste. Continuar?',
    )
    if (!confirmado) {
      return
    }

    setErro('')
    setEncerrando(true)
    try {
      await encerrarTodasAsSessoes()
      // O token atual acabou de ser invalidado: encerrar a sessão local agora evita
      // deixar a tela num limbo até a próxima requisição falhar com 401.
      sair()
      navegar('/login')
    } catch (excecao) {
      setErro(extrairMensagemErro(excecao, 'Não foi possível encerrar as sessões'))
    } finally {
      setEncerrando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold text-slate-900">GeFinX</span>
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
              onClick={aoEncerrarTodas}
              disabled={encerrando}
              className="text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline disabled:opacity-60"
            >
              {encerrando ? 'Encerrando...' : 'Sair de todos'}
            </button>
            <button
              onClick={aoSair}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      {erro && (
        <p className="mx-auto max-w-5xl px-4 pt-3 text-sm text-red-600">{erro}</p>
      )}
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
