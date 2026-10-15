import { createContext, useCallback, useContext, useId, useRef, useState, type ReactNode } from 'react'
import { Modal } from '../componentes/Modal'

export interface PedidoDeConfirmacao {
  titulo: string
  mensagem: string
  /** O verbo do botão — "Excluir", "Desfazer". Um "OK" não diz o que vai acontecer. */
  confirmar: string
  /** Botão vermelho: o que se confirma não volta atrás sozinho. */
  perigosa?: boolean
}

export interface OpcaoDaEscolha<T extends string> {
  valor: T
  rotulo: string
  /** O que acontece com essa escolha, embaixo do rótulo. */
  descricao: string
}

/** Uma confirmação com alternativas: a primeira vem marcada, e é a que menos destrói. */
export interface PedidoDeEscolha<T extends string> extends PedidoDeConfirmacao {
  opcoes: OpcaoDaEscolha<T>[]
}

type Escolher = <T extends string>(pedido: PedidoDeEscolha<T>) => Promise<T | null>

interface PedidoAberto {
  pedido: PedidoDeConfirmacao
  opcoes: OpcaoDaEscolha<string>[]
}

const ContextoConfirmacao = createContext<Escolher | undefined>(undefined)

/**
 * A confirmação da própria aplicação, no lugar do `window.confirm`. O diálogo nativo não segue
 * o tema, e há navegadores que o suprimem — o embutido no app do Claude responde "Cancelar"
 * sozinho, sem mostrar nada, e quem pede para excluir vê o botão não fazer coisa alguma.
 *
 * Quem pede espera por uma promessa, como esperava pelo `window.confirm`: o fluxo de cada tela
 * continua sendo um `if` no começo da ação. A confirmação simples é a escolha sem alternativas.
 */
export function ProvedorConfirmacao({ children }: { children: ReactNode }) {
  const [aberto, setAberto] = useState<PedidoAberto | null>(null)
  const [escolhida, setEscolhida] = useState<string | null>(null)
  const resolver = useRef<((resposta: string | null) => void) | null>(null)
  const grupo = useId()

  const escolher = useCallback(
    <T extends string>({ opcoes, ...pedido }: PedidoDeEscolha<T>) =>
      new Promise<T | null>((resolve) => {
        // Um pedido novo com outro aberto vale como "não" para o anterior: ninguém fica
        // esperando para sempre por uma resposta que não vai chegar.
        resolver.current?.(null)
        resolver.current = resolve as (resposta: string | null) => void
        setAberto({ pedido, opcoes })
        setEscolhida(opcoes[0]?.valor ?? null)
      }),
    [],
  )

  function responder(resposta: string | null) {
    resolver.current?.(resposta)
    resolver.current = null
    setAberto(null)
  }

  return (
    <ContextoConfirmacao.Provider value={escolher}>
      {children}
      {aberto && (
        <Modal titulo={aberto.pedido.titulo} aoFechar={() => responder(null)}>
          <p className="text-sm text-slate-700 dark:text-slate-300">{aberto.pedido.mensagem}</p>

          {aberto.opcoes.length > 0 && (
            <fieldset className="mt-3 space-y-2">
              <legend className="sr-only">{aberto.pedido.titulo}</legend>
              {aberto.opcoes.map((opcao) => (
                <label
                  key={opcao.valor}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-300 p-3 has-checked:border-emerald-600 dark:border-slate-700 dark:has-checked:border-emerald-400"
                >
                  <input
                    type="radio"
                    name={grupo}
                    checked={escolhida === opcao.valor}
                    onChange={() => setEscolhida(opcao.valor)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600 dark:accent-emerald-400"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">{opcao.rotulo}</span>
                    <span className="block text-sm text-slate-600 dark:text-slate-300">{opcao.descricao}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}

          {/* O foco começa em Cancelar: um Enter apressado não exclui nada. */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => responder(aberto.opcoes.length > 0 ? escolhida : 'sim')}
              className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
                aberto.pedido.perigosa ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {aberto.pedido.confirmar}
            </button>
            <button
              type="button"
              data-foco-inicial
              onClick={() => responder(null)}
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

function useEscolherDoContexto(): Escolher {
  const contexto = useContext(ContextoConfirmacao)
  if (!contexto) {
    throw new Error('useConfirmacao deve ser usado dentro de um ProvedorConfirmacao')
  }
  return contexto
}

/** Sim ou não. */
export function useConfirmacao(): (pedido: PedidoDeConfirmacao) => Promise<boolean> {
  const escolher = useEscolherDoContexto()
  return useCallback(async (pedido) => (await escolher({ ...pedido, opcoes: [] })) !== null, [escolher])
}

/** Uma das alternativas, ou `null` se quem foi perguntado desistiu. */
export function useEscolha(): Escolher {
  return useEscolherDoContexto()
}
