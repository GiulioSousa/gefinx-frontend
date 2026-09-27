import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { VIDRO } from './vidro'

const MARGEM = 8

/**
 * Abaixo da âncora e alinhado à sua borda direita — onde ficava a coluna de ações das listas,
 * e onde fica o ícone da conta. Se não couber embaixo, abre para cima; nunca sai da tela.
 */
function posicionar(menu: HTMLElement, ancora: HTMLElement) {
  const caixa = ancora.getBoundingClientRect()
  const largura = document.documentElement.clientWidth
  const altura = document.documentElement.clientHeight
  const esquerda = Math.max(MARGEM, Math.min(caixa.right - menu.offsetWidth, largura - menu.offsetWidth - MARGEM))
  let topo = caixa.bottom + 4
  if (topo + menu.offsetHeight > altura - MARGEM && caixa.top - 4 - menu.offsetHeight >= MARGEM) {
    topo = caixa.top - 4 - menu.offsetHeight
  }
  menu.style.left = `${esquerda}px`
  menu.style.top = `${topo}px`
}

interface MenuFlutuanteProps {
  /** O elemento que abriu o menu: é embaixo dele que o menu aparece, e a ele o foco volta. */
  ancora: HTMLElement
  aoFechar: () => void
  rotulo: string
  id?: string
  children: ReactNode
}

/**
 * Menu solto sobre a página, montado na Popover API para subir à camada acima de tudo. A
 * camada importa como no Modal: as listas moram em cartões de vidro, que são contextos de
 * empilhamento, e a tabela de contas rola na horizontal — um menu posicionado dentro deles
 * seria cortado ou ficaria atrás do cartão seguinte.
 *
 * O popover é `manual`, e o fechar por fora é feito aqui. O `auto` fecha sozinho a um toque
 * fora, mas conta como "fora" o próprio botão que abriu o menu: tocar nele de novo fecharia e,
 * no mesmo gesto, reabriria. Aqui um toque na âncora fica com ela, que alterna o menu.
 *
 * Como o Modal, existe só enquanto está aberto: quem abre é quem monta.
 */
export function MenuFlutuante({ ancora, aoFechar, rotulo, id, children }: MenuFlutuanteProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  // O efeito roda uma vez, mas precisa sempre da versão atual de quem fecha.
  const aoFecharRef = useRef(aoFechar)
  useLayoutEffect(() => {
    aoFecharRef.current = aoFechar
  })

  useLayoutEffect(() => {
    const menu = menuRef.current
    if (!menu) {
      return
    }
    const fechar = () => aoFecharRef.current()
    const estaDentro = (alvo: EventTarget | null) =>
      alvo instanceof Node && (menu.contains(alvo) || ancora.contains(alvo))
    const aoTocar = (evento: PointerEvent) => {
      if (!estaDentro(evento.target)) {
        fechar()
      }
    }
    // O foco saindo pelo Tab conta como sair do menu, do mesmo jeito que um toque fora.
    const aoFocar = (evento: FocusEvent) => {
      if (!estaDentro(evento.target)) {
        fechar()
      }
    }
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.preventDefault()
        fechar()
      }
    }

    menu.showPopover()
    posicionar(menu, ancora)
    menu.querySelector<HTMLElement>('button, a')?.focus({ preventScroll: true })

    // Preso a coordenadas da tela, o menu ficaria para trás enquanto a âncora rola. Mas fecha
    // só se a âncora se mexeu, e não a qualquer evento de rolagem: o evento chega no quadro
    // seguinte, e o último de uma rolagem por inércia, interrompida justamente pelo toque que
    // abriu o menu, o fecharia logo depois de aberto.
    let origem = ancora.getBoundingClientRect()
    const aoRolar = () => {
      const agora = ancora.getBoundingClientRect()
      if (Math.abs(agora.top - origem.top) > 1 || Math.abs(agora.left - origem.left) > 1) {
        fechar()
      }
    }
    // Redimensionar reposiciona em vez de fechar: no celular a barra de endereço que aparece
    // e some muda a altura da janela sem que ninguém tenha pedido para sair do menu.
    const aoRedimensionar = () => {
      posicionar(menu, ancora)
      origem = ancora.getBoundingClientRect()
    }

    document.addEventListener('pointerdown', aoTocar, true)
    document.addEventListener('focusin', aoFocar)
    document.addEventListener('keydown', aoTeclar)
    window.addEventListener('scroll', aoRolar, { capture: true, passive: true })
    window.addEventListener('resize', aoRedimensionar)

    return () => {
      document.removeEventListener('pointerdown', aoTocar, true)
      document.removeEventListener('focusin', aoFocar)
      document.removeEventListener('keydown', aoTeclar)
      window.removeEventListener('scroll', aoRolar, { capture: true })
      window.removeEventListener('resize', aoRedimensionar)
      // Com o foco dentro do menu, fechá-lo o jogaria no começo da página. Ele volta para
      // quem abriu — e é daí que um modal aberto por uma das opções o devolve depois.
      if (menu.contains(document.activeElement) || document.activeElement === document.body) {
        const gatilho = ancora.matches('button') ? ancora : ancora.querySelector<HTMLElement>('button')
        gatilho?.focus({ preventScroll: true })
      }
      if (menu.matches(':popover-open')) {
        menu.hidePopover()
      }
    }
  }, [ancora])

  return (
    // O vidro vai num filho: o `relative` dele desfaria o `fixed` com que o popover se prende
    // à tela, e o menu passaria a se posicionar pela página.
    <div ref={menuRef} id={id} popover="manual" role="group" aria-label={rotulo} className="m-0 inset-auto overflow-visible bg-transparent p-0">
      <div className={`flex min-w-44 flex-col gap-0.5 rounded-lg p-1.5 ${VIDRO}`}>{children}</div>
    </div>
  )
}

/** Uma opção do menu. `perigosa` pinta de vermelho o que não se desfaz, como excluir. */
export function OpcaoDoMenu({
  aoEscolher,
  perigosa = false,
  children,
}: {
  aoEscolher: () => void
  perigosa?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={aoEscolher}
      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60 ${
        perigosa ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'
      }`}
    >
      {children}
    </button>
  )
}
