/**
 * A ação principal da tela, presa ao canto inferior direito — alcançável de qualquer ponto
 * da rolagem, e não só do topo da página. No celular é um círculo só com o ícone, logo
 * acima da barra de abas; a partir de `sm` ganha o rótulo por extenso, porque ali há
 * espaço e um "+" sozinho numa tela larga diz menos do que o texto.
 */
export function BotaoFlutuante({ rotulo, onClick }: { rotulo: string; onClick: () => void }) {
  return (
    <>
      {/*
        Reserva, no fim do conteúdo, a altura que o botão ocupa. Sem ela, rolando até o
        fim, o botão pousaria em cima do que estiver no canto direito — na lista de
        transações, justamente o "Próxima" da paginação.
      */}
      <div aria-hidden="true" className="h-16" />
      <button
        type="button"
        onClick={onClick}
        className="fixed right-4 bottom-24 z-10 flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 sm:right-6 sm:bottom-6 sm:h-12 sm:w-auto sm:px-5"
      >
        <svg
          className="h-6 w-6 sm:h-5 sm:w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span className="sr-only sm:not-sr-only sm:text-sm sm:font-medium">{rotulo}</span>
      </button>
    </>
  )
}
