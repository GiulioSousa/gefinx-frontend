import { useTema } from '../contextos/ContextoTema'

/**
 * Alterna entre claro e escuro. O ícone mostra o tema para onde o clique leva, e não o
 * atual: sozinho na barra, um sol num fundo já claro não diria se é estado ou destino.
 *
 * Com `comRotulo` vira uma opção do menu da conta, com o destino escrito ao lado do ícone:
 * numa lista de opções em texto, um ícone sozinho seria a única sem nome.
 */
export function BotaoDeTema({ className = '', comRotulo = false }: { className?: string; comRotulo?: boolean }) {
  const { tema, alternarTema } = useTema()
  const paraEscuro = tema === 'claro'
  const rotulo = paraEscuro ? 'Ativar tema escuro' : 'Ativar tema claro'

  return (
    <button
      type="button"
      onClick={alternarTema}
      title={comRotulo ? undefined : rotulo}
      aria-label={comRotulo ? undefined : rotulo}
      className={
        comRotulo
          ? `flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 ${className}`
          : `rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 ${className}`
      }
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
        {paraEscuro ? (
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </>
        )}
      </svg>
      {comRotulo && (paraEscuro ? 'Tema escuro' : 'Tema claro')}
    </button>
  )
}
