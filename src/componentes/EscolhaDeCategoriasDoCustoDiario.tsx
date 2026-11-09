import { useState, type FormEvent } from 'react'
import type { CategoriaDoPlanejamento } from '../tipos'
import { extrairMensagemErro } from '../api/erros'

interface EscolhaDeCategoriasDoCustoDiarioProps {
  categorias: CategoriaDoPlanejamento[]
  /** Recebe as categorias marcadas — a escolha inteira, como a API espera. */
  aoSalvar: (categoriasDoCustoDiario: number[]) => Promise<void>
  aoCancelar: () => void
}

/**
 * Quais categorias de despesa formam o custo diário: o gasto médio delas nos últimos 30 dias
 * entra na meta. A caixa marcada diz "entra" — ao contrário das contas, aqui o comum é ficar de
 * fora, e uma categoria nova não entra sozinha.
 *
 * É um rascunho, aplicado de uma vez no Salvar, como a escolha de contas.
 */
export function EscolhaDeCategoriasDoCustoDiario({ categorias, aoSalvar, aoCancelar }: EscolhaDeCategoriasDoCustoDiarioProps) {
  const [entram, setEntram] = useState(
    () => new Set(categorias.filter((categoria) => categoria.entraNoCustoDiario).map((categoria) => categoria.id)),
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
      await aoSalvar(categorias.filter((categoria) => entram.has(categoria.id)).map((categoria) => categoria.id))
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
          O gasto médio das categorias marcadas nos últimos 30 dias, por dia de trabalho, entra na meta diária. Pagamentos
          de despesas planejadas e gastos de contas fora do planejamento não contam.
        </legend>
        {categorias.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Nenhuma categoria de despesa cadastrada. Crie as categorias em Transações.
          </p>
        ) : (
          <div className="space-y-1">
            {categorias.map((categoria, indice) => (
              <label
                key={categoria.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-slate-900 hover:bg-slate-900/5 dark:text-slate-100 dark:hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={entram.has(categoria.id)}
                  onChange={() => alternar(categoria.id)}
                  data-foco-inicial={indice === 0 ? true : undefined}
                  className="h-4 w-4 accent-emerald-600"
                />
                {categoria.nome}
              </label>
            ))}
          </div>
        )}
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
