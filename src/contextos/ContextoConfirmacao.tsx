import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Modal } from '../componentes/Modal'

export interface PedidoDeConfirmacao {
  titulo: string
  mensagem: string
  /** O verbo do botão — "Excluir", "Desfazer". Um "OK" não diz o que vai acontecer. */
  confirmar: string
  /** Botão vermelho: o que se confirma não volta atrás sozinho. */
  perigosa?: boolean
}

type Confirmar = (pedido: PedidoDeConfirmacao) => Promise<boolean>

const ContextoConfirmacao = createContext<Confirmar | undefined>(undefined)

/**
 * A confirmação da própria aplicação, no lugar do `window.confirm`. O diálogo nativo não segue
 * o tema, e há navegadores que o suprimem — o embutido no app do Claude responde "Cancelar"
 * sozinho, sem mostrar nada, e quem pede para excluir vê o botão não fazer coisa alguma.
 *
 * `confirmar` devolve uma promessa, e quem pede espera por ela como esperava pelo
 * `window.confirm`: o fluxo de cada tela continua sendo um `if` no começo da ação.
 */
export function ProvedorConfirmacao({ children }: { children: ReactNode }) {
  const [pedido, setPedido] = useState<PedidoDeConfirmacao | null>(null)
  const resolver = useRef<((resposta: boolean) => void) | null>(null)

  const confirmar = useCallback<Confirmar>(
    (novo) =>
      new Promise((resolve) => {
        // Um pedido novo com outro aberto vale como "não" para o anterior: ninguém fica
        // esperando para sempre por uma resposta que não vai chegar.
        resolver.current?.(false)
        resolver.current = resolve
        setPedido(novo)
      }),
    [],
  )

  function responder(resposta: boolean) {
    resolver.current?.(resposta)
    resolver.current = null
    setPedido(null)
  }

  return (
    <ContextoConfirmacao.Provider value={confirmar}>
      {children}
      {pedido && (
        <Modal titulo={pedido.titulo} aoFechar={() => responder(false)}>
          <p className="text-sm text-slate-700 dark:text-slate-300">{pedido.mensagem}</p>
          {/* O foco começa em Cancelar: um Enter apressado não exclui nada. */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => responder(true)}
              className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
                pedido.perigosa ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {pedido.confirmar}
            </button>
            <button
              type="button"
              data-foco-inicial
              onClick={() => responder(false)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </ContextoConfirmacao.Provider>
  )
}

export function useConfirmacao(): Confirmar {
  const contexto = useContext(ContextoConfirmacao)
  if (!contexto) {
    throw new Error('useConfirmacao deve ser usado dentro de um ProvedorConfirmacao')
  }
  return contexto
}
