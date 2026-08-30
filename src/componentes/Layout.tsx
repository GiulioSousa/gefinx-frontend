import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAutenticacao } from '../contextos/ContextoAutenticacao'
import { encerrarTodasAsSessoes } from '../api/sessoesApi'
import { extrairMensagemErro } from '../api/erros'
import { BotaoDeTema } from './BotaoDeTema'

const linkClasse = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
  }`

const ROTAS = [
  { para: '/', rotulo: 'Painel', exata: true },
  { para: '/transacoes', rotulo: 'Transações', exata: false },
  { para: '/contas', rotulo: 'Contas', exata: false },
  { para: '/categorias', rotulo: 'Categorias', exata: false },
]

export function Layout({ children }: { children: ReactNode }) {
  const { usuario, sair } = useAutenticacao()
  const navegar = useNavigate()
  const [encerrando, setEncerrando] = useState(false)
  const [erro, setErro] = useState('')
  const [menuAberto, setMenuAberto] = useState(false)

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-between py-3">
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">GeFinX</span>

            {/*
              A partir de `sm` tudo cabe numa linha, que é como sempre foi. Abaixo disso não
              cabia: os quatro links mais o nome e os dois botões pediam 555px de largura, e
              num celular de 375px o cabeçalho esticava a página inteira — a rolagem
              horizontal que aparecia em todas as telas nascia aqui.
            */}
            <nav className="hidden items-center gap-1 sm:flex">
              {ROTAS.map((rota) => (
                <NavLink key={rota.para} to={rota.para} end={rota.exata} className={linkClasse}>
                  {rota.rotulo}
                </NavLink>
              ))}
            </nav>

            {/*
              Tema e menu ficam juntos na ponta direita em qualquer largura. O bloco da
              conta entra na frente deles só quando há espaço para a linha inteira.
            */}
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-3 sm:flex">
                <span className="text-sm text-slate-500 dark:text-slate-400">{usuario?.nome}</span>
                <button
                  onClick={aoEncerrarTodas}
                  disabled={encerrando}
                  className="text-sm text-slate-500 dark:text-slate-400 underline-offset-2 hover:text-slate-700 dark:hover:text-slate-200 hover:underline disabled:opacity-60"
                >
                  {encerrando ? 'Encerrando...' : 'Sair de todos'}
                </button>
                <button
                  onClick={aoSair}
                  className="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Sair
                </button>
              </div>

              <BotaoDeTema />

              <button
                type="button"
                onClick={() => setMenuAberto((aberto) => !aberto)}
                aria-expanded={menuAberto}
                aria-controls="menu-principal"
                aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
                className="rounded-md p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden"
              >
                {/* Duas barras viram X quando aberto: o mesmo botão abre e fecha, então
                    precisa dizer em qual dos dois estados está. */}
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  {menuAberto ? (
                    <>
                      <line x1="5" y1="5" x2="19" y2="19" />
                      <line x1="19" y1="5" x2="5" y2="19" />
                    </>
                  ) : (
                    <>
                      <line x1="4" y1="7" x2="20" y2="7" />
                      <line x1="4" y1="12" x2="20" y2="12" />
                      <line x1="4" y1="17" x2="20" y2="17" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          {menuAberto && (
            <div id="menu-principal" className="border-t border-slate-200 dark:border-slate-800 py-3 sm:hidden">
              <nav className="flex flex-col gap-1">
                {ROTAS.map((rota) => (
                  <NavLink
                    key={rota.para}
                    to={rota.para}
                    end={rota.exata}
                    // Fecha ao navegar: deixar o menu aberto por cima da tela que ele
                    // acabou de abrir obrigaria um segundo toque para ver o conteúdo.
                    onClick={() => setMenuAberto(false)}
                    className={linkClasse}
                  >
                    {rota.rotulo}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                <span className="px-3 text-sm text-slate-500 dark:text-slate-400">{usuario?.nome}</span>
                <button
                  onClick={aoEncerrarTodas}
                  disabled={encerrando}
                  className="rounded-md px-3 py-2 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
                >
                  {encerrando ? 'Encerrando...' : 'Sair de todos'}
                </button>
                <button
                  onClick={aoSair}
                  className="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
      {erro && (
        <p className="mx-auto max-w-5xl px-4 pt-3 text-sm text-red-600 dark:text-red-400">{erro}</p>
      )}
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
