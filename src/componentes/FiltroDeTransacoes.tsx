import { useState } from 'react'
import type { Categoria, Conta, FiltroTransacoes } from '../tipos'

const ENTRADA = 'mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm dark:text-slate-100 focus:border-emerald-500 focus:outline-none'

interface FiltroDeTransacoesProps {
  filtro: FiltroTransacoes
  contas: Conta[]
  categorias: Categoria[]
  aoAplicar: (filtro: FiltroTransacoes) => void
  aoCancelar: () => void
}

/**
 * Os recortes da listagem, editados num rascunho e aplicados de uma vez. Fora do modal cada
 * campo filtrava no ato, e a lista respondia logo abaixo; dentro dele a lista está coberta,
 * e buscar a cada campo mudado seria ir ao servidor por recortes que ninguém vê. Fechar sem
 * aplicar descarta o rascunho — a lista continua mostrando o que o ícone de filtro diz.
 */
export function FiltroDeTransacoes({ filtro, contas, categorias, aoAplicar, aoCancelar }: FiltroDeTransacoesProps) {
  const [rascunho, setRascunho] = useState<FiltroTransacoes>(filtro)

  function ajustar(mudanca: Partial<FiltroTransacoes>) {
    setRascunho((atual) => ({ ...atual, ...mudanca }))
  }

  const temRascunho = Object.values(rascunho).some((valor) => valor !== undefined)

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault()
        aoAplicar(rascunho)
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-600 dark:text-slate-300">
          De
          <input
            type="date"
            value={rascunho.dataInicio ?? ''}
            onChange={(evento) => ajustar({ dataInicio: evento.target.value || undefined })}
            className={ENTRADA}
          />
        </label>
        <label className="text-sm text-slate-600 dark:text-slate-300">
          Até
          <input
            type="date"
            value={rascunho.dataFim ?? ''}
            onChange={(evento) => ajustar({ dataFim: evento.target.value || undefined })}
            className={ENTRADA}
          />
        </label>
        <label className="text-sm text-slate-600 dark:text-slate-300">
          Tipo
          <select
            value={rascunho.tipo ?? ''}
            onChange={(evento) => ajustar({ tipo: (evento.target.value || undefined) as FiltroTransacoes['tipo'] })}
            className={ENTRADA}
          >
            <option value="">Todos</option>
            <option value="RECEITA">Receita</option>
            <option value="DESPESA">Despesa</option>
            <option value="TRANSFERENCIA">Transferência</option>
          </select>
        </label>
        <label className="text-sm text-slate-600 dark:text-slate-300">
          Conta
          <select
            value={rascunho.contaId ?? ''}
            onChange={(evento) =>
              ajustar({ contaId: evento.target.value ? Number(evento.target.value) : undefined })
            }
            className={ENTRADA}
          >
            <option value="">Todas</option>
            {contas.map((conta) => (
              <option key={conta.id} value={conta.id}>
                {conta.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600 dark:text-slate-300 sm:col-span-2">
          Categoria
          <select
            value={rascunho.categoriaId ?? ''}
            onChange={(evento) =>
              ajustar({ categoriaId: evento.target.value ? Number(evento.target.value) : undefined })
            }
            className={ENTRADA}
          >
            <option value="">Todas</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Aplicar
        </button>
        <button
          type="button"
          onClick={aoCancelar}
          className="rounded-md border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
        {/* Limpa o rascunho, e não a lista: o "Aplicar" continua sendo o único que busca. */}
        {temRascunho && (
          <button
            type="button"
            onClick={() => setRascunho({})}
            className="ml-auto text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </form>
  )
}
