import { useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { VIDRO } from './vidro'

interface ModalProps {
  titulo: string
  aoFechar: () => void
  /**
   * Tocar fora fecha, a não ser que o conteúdo seja algo que se perde. Num formulário meio
   * preenchido, um toque acidental no escuro em volta jogaria fora o que já foi digitado.
   */
  fecharAoTocarFora?: boolean
  children: ReactNode
}

/**
 * Janela sobre a tela, montada no `<dialog>` nativo: o `showModal` já entrega o que um modal
 * feito à mão teria de reimplementar — o Esc, o foco preso dentro dele, o resto da página
 * inerte e a camada acima de tudo. A camada importa aqui: os cartões de vidro são contextos
 * de empilhamento, e um `fixed` comum aberto dentro de um deles ficaria preso ao cartão.
 *
 * Quem abre é quem monta: o modal existe enquanto está aberto, e o conteúdo nasce de novo a
 * cada abertura — um formulário não herda o que sobrou da vez anterior.
 */
export function Modal({ titulo, aoFechar, fecharAoTocarFora = true, children }: ModalProps) {
  const dialogoRef = useRef<HTMLDialogElement>(null)
  const idDoTitulo = useId()
  // O clique só conta como "fora" se também começou fora. Arrastar a seleção de um campo
  // até o escuro em volta termina num clique no próprio diálogo, e fecharia a janela.
  const toqueComecouFora = useRef(false)

  // De layout, e não um efeito comum: o `close` precisa rodar antes de o React tirar o
  // diálogo da página, para que o navegador devolva o foco a quem abriu a janela.
  useLayoutEffect(() => {
    const dialogo = dialogoRef.current
    if (!dialogo) {
      return
    }
    dialogo.showModal()
    // Sem marcação, o navegador foca o primeiro controle — o botão de fechar.
    dialogo.querySelector<HTMLElement>('[data-foco-inicial]')?.focus()
    return () => dialogo.close()
  }, [])

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby={idDoTitulo}
      onCancel={(evento) => {
        // O Esc fecharia o diálogo por conta própria, com o estado de quem o abriu ainda
        // dizendo "aberto". Quem decide é o estado.
        evento.preventDefault()
        aoFechar()
      }}
      onPointerDown={(evento) => {
        toqueComecouFora.current = evento.target === evento.currentTarget
      }}
      onClick={(evento) => {
        if (fecharAoTocarFora && toqueComecouFora.current && evento.target === evento.currentTarget) {
          aoFechar()
        }
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-visible bg-transparent backdrop:bg-slate-50/60 backdrop:backdrop-blur-sm dark:backdrop:bg-slate-950/60 motion-safe:transition motion-safe:duration-200 starting:translate-y-2 starting:opacity-0"
    >
      {/* O véu em volta clareia em vez de escurecer: sobre um fundo escurecido, o vidro
          ficaria cinza, e o texto auxiliar e as mensagens de erro cairiam abaixo de AA. */}
      <div className={`flex max-h-[calc(100dvh-2rem)] flex-col rounded-lg ${VIDRO}`}>
        <div className="flex items-center justify-between gap-3 px-4 pt-3">
          <h2 id={idDoTitulo} className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="-mr-2 rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-4 pt-2 pb-4">{children}</div>
      </div>
    </dialog>
  )
}
