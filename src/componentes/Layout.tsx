import { useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAutenticacao } from '../contextos/ContextoAutenticacao'
import { encerrarTodasAsSessoes } from '../api/sessoesApi'
import { extrairMensagemErro } from '../api/erros'
import { BotaoDeTema } from './BotaoDeTema'
import { VIDRO } from './vidro'

const linkClasse = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
  }`

// Ícone com o nome da aba embaixo: o desenho de uma etiqueta não diz "Categorias" a quem
// ainda não aprendeu o que cada ícone quer dizer. O rótulo visível é também o nome que o
// leitor de tela anuncia, sem precisar de `aria-label`.
//
// Verde 700 na ativa e cinza 600 nas demais, um tom mais escuros do que a tela usa em outros
// lugares: o fundo da barra é translúcido, e o que passa por baixo come parte do contraste
// que num cartão opaco sobraria. Negrito e a bolha repetem o estado para quem não distingue
// a cor.
const abaClasse = ({ isActive }: { isActive: boolean }) =>
  `relative z-10 flex flex-1 flex-col items-center gap-0.5 py-1.5 text-xs transition-colors ${
    isActive
      ? 'font-semibold text-emerald-700 dark:text-emerald-400'
      : 'font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
  }`

/*
  A bolha tem largura própria, e não a da aba, que muda com a tela. Por isso são duas peças:
  o trilho, da largura de uma aba, é o que desliza — `translateX` em porcentagem conta a
  largura do próprio elemento, então 100% é exatamente uma aba —, e a bolha fica centrada
  dentro dele. Na altura ela acompanha a aba, para abraçar ícone e rótulo juntos.

  A curva passa um pouco do ponto e volta: é essa sobra que faz a bolha parecer líquida, e
  não uma peça rígida trocando de lugar.
*/
const TRILHO_DA_BOLHA =
  'absolute inset-y-0 left-0 flex w-1/4 items-center justify-center motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.34,1.4,0.64,1)]'

const BOLHA = [
  'h-full w-24 rounded-full',
  'bg-white/75 dark:bg-white/15',
  'shadow-[0_2px_10px_-2px_rgb(15_23_43/0.25),inset_0_1px_0_rgb(255_255_255/1)]',
  'dark:shadow-[0_2px_10px_-2px_rgb(0_0_0/0.5),inset_0_1px_0_rgb(255_255_255/0.2)]',
].join(' ')

// Os ícones seguem o traço do BotaoDeTema: 24×24, contorno de 2, pontas arredondadas.
const ROTAS: { para: string; rotulo: string; exata: boolean; icone: ReactNode }[] = [
  {
    para: '/',
    rotulo: 'Painel',
    exata: true,
    icone: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
  },
  {
    para: '/transacoes',
    rotulo: 'Transações',
    exata: false,
    icone: (
      <>
        <path d="M7 4v16" />
        <path d="M3 8l4-4 4 4" />
        <path d="M17 20V4" />
        <path d="M21 16l-4 4-4-4" />
      </>
    ),
  },
  {
    para: '/contas',
    rotulo: 'Contas',
    exata: false,
    icone: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </>
    ),
  },
  {
    para: '/categorias',
    rotulo: 'Categorias',
    exata: false,
    icone: (
      <>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </>
    ),
  },
]

export function Layout({ children }: { children: ReactNode }) {
  const { usuario, sair } = useAutenticacao()
  const navegar = useNavigate()
  const { pathname } = useLocation()
  const [encerrando, setEncerrando] = useState(false)
  const [erro, setErro] = useState('')
  const [menuContaAberto, setMenuContaAberto] = useState(false)

  // A bolha da aba ativa é uma peça só, que desliza entre as abas, e não uma por aba — o
  // deslizar é o que dá ao vidro a impressão de líquido. Por isso ela precisa saber a
  // posição da rota atual, pela mesma regra de correspondência que o NavLink usa.
  const indiceAtivo = ROTAS.findIndex((rota) =>
    rota.exata ? pathname === rota.para : pathname.startsWith(rota.para),
  )

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
              horizontal que aparecia em todas as telas nascia aqui. No celular os links
              descem para a barra de abas, no pé da tela.
            */}
            <nav className="hidden items-center gap-1 sm:flex">
              {ROTAS.map((rota) => (
                <NavLink key={rota.para} to={rota.para} end={rota.exata} className={linkClasse}>
                  {rota.rotulo}
                </NavLink>
              ))}
            </nav>

            {/*
              Tema e conta ficam juntos na ponta direita em qualquer largura. O bloco da
              conta entra na frente deles só quando há espaço para a linha inteira.
            */}
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-3 sm:flex">
                <span className="text-sm text-slate-500 dark:text-slate-400">{usuario}</span>
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

              {/*
                Sair não é destino, e por isso não virou aba: fica no cabeçalho, atrás do
                ícone da conta. A barra de abas guarda só lugares para onde se vai.
              */}
              <button
                type="button"
                onClick={() => setMenuContaAberto((aberto) => !aberto)}
                aria-expanded={menuContaAberto}
                aria-controls="menu-conta"
                aria-label={menuContaAberto ? 'Fechar menu da conta' : 'Abrir menu da conta'}
                className={`rounded-md p-2 sm:hidden ${
                  menuContaAberto
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            </div>
          </div>

          {menuContaAberto && (
            <div
              id="menu-conta"
              className="flex flex-col gap-2 border-t border-slate-200 dark:border-slate-800 py-3 sm:hidden"
            >
              <span className="px-3 text-sm text-slate-500 dark:text-slate-400">{usuario}</span>
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
          )}
        </div>
      </header>
      {erro && (
        <p className="mx-auto max-w-5xl px-4 pt-3 text-sm text-red-600 dark:text-red-400">{erro}</p>
      )}
      {/* O `pb-24` no celular reserva o espaço da barra fixa: sem ele, o último cartão da
          lista ficaria para sempre por baixo das abas, sem rolagem que o alcançasse. */}
      <main className="mx-auto max-w-5xl px-4 pt-8 pb-24 sm:pb-8">{children}</main>

      {/* Solta das bordas, e não colada ao pé da tela: o conteúdo passa por baixo e em
          volta dela, que é o que dá ao vidro alguma coisa para desfocar. */}
      <nav aria-label="Navegação principal" className="fixed inset-x-4 bottom-3 z-10 sm:hidden">
        <div className={`rounded-full p-1.5 ${VIDRO}`}>
          <div className="relative flex">
            {indiceAtivo >= 0 && (
              <span
                aria-hidden="true"
                className={TRILHO_DA_BOLHA}
                style={{ transform: `translateX(${indiceAtivo * 100}%)` }}
              >
                <span className={BOLHA} />
              </span>
            )}
            {ROTAS.map((rota) => (
              <NavLink
                key={rota.para}
                to={rota.para}
                end={rota.exata}
                // O menu da conta mora no cabeçalho, fora da tela que a aba abre. Deixá-lo
                // aberto empurraria o conteúdo novo para baixo até um segundo toque.
                onClick={() => setMenuContaAberto(false)}
                className={abaClasse}
              >
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {rota.icone}
                </svg>
                {rota.rotulo}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  )
}
