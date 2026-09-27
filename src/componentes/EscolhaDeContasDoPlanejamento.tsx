import { useState, type FormEvent } from 'react'
import type { ContaDoPlanejamento } from '../tipos'
import { extrairMensagemErro } from '../api/erros'

interface EscolhaDeContasDoPlanejamentoProps {
  contas: ContaDoPlanejamento[]
  /** Recebe as contas que ficam de fora — a escolha inteira, como a API espera. */
  aoSalvar: (contasDeFora: number[]) => Promise<void>
  aoCancelar: () => void
}

/**
 * Quais contas entram no saldo do planejamento. A caixa marcada diz "entra", e não "fica de
 * fora": a conta nova entra sozinha, e o caso comum é o marcado.
 *
 * É um rascunho, aplicado de uma vez no Salvar, como o filtro de transações.
 */
export function EscolhaDeContasDoPlanejamento({ contas, aoSalvar, aoCancelar }: EscolhaDeContasDoPlanejamentoProps) {
  const [entram, setEntram] = useState(
    () => new Set(contas.filter((conta) => conta.entraNoPlanejamento).map((conta) => conta.id)),
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  function alternar(id: number) {
    setEntram((atual) => {
      const nova = new Set(atual)
      if (nova.has(id)) {
        nova.delete(id)
      } else {
        nova.add(id)
      }
      return nova
    })
  }

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      await aoSalvar(contas.filter((conta) => !entram.has(conta.id)).map((conta) => conta.id))
    } catch (excecao) {
      setErro(extrairMensagemErro(excecao, 'Não foi possível salvar a escolha'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={aoSubmeter}>
      <fieldset>
        <legend className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          O saldo do planejamento soma só as contas marcadas. Dinheiro transferido para uma conta desmarcada sai do
          planejamento.
        </legend>
        <div className="space-y-1">
          {contas.map((conta, indice) => (
            <label
              key={conta.id}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-slate-900 hover:bg-slate-900/5 dark:text-slate-100 dark:hover:bg-white/5"
            >
              <input
                type="checkbox"
                checked={entram.has(conta.id)}
                onChange={() => alternar(conta.id)}
                data-foco-inicial={indice === 0 ? true : undefined}
                className="h-4 w-4 accent-emerald-600"
              />
              {conta.nome}
            </label>
          ))}
        </div>
      </fieldset>

      {erro && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{erro}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={aoCancelar}
          className="rounded-md border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
