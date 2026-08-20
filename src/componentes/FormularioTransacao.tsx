import { useMemo, useState, type FormEvent } from 'react'
import type { Categoria, TipoTransacao, Transacao } from '../tipos'
import type { DadosTransacao } from '../api/transacoesApi'
import { ErroDeFormulario } from '../api/erros'
import { ErroDeCampo } from './ErroDeCampo'

interface FormularioTransacaoProps {
  categorias: Categoria[]
  transacaoInicial?: Transacao
  aoSalvar: (dados: DadosTransacao) => Promise<void>
  aoCancelar: () => void
}

function dataDeHoje(): string {
  return new Date().toISOString().slice(0, 10)
}

export function FormularioTransacao({ categorias, transacaoInicial, aoSalvar, aoCancelar }: FormularioTransacaoProps) {
  const [descricao, setDescricao] = useState(transacaoInicial?.descricao ?? '')
  const [valor, setValor] = useState(transacaoInicial ? String(transacaoInicial.valor) : '')
  const [tipo, setTipo] = useState<TipoTransacao>(transacaoInicial?.tipo ?? 'DESPESA')
  const [categoriaId, setCategoriaId] = useState<number | ''>(transacaoInicial?.categoriaId ?? '')
  const [dataTransacao, setDataTransacao] = useState(transacaoInicial?.dataTransacao ?? dataDeHoje())
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [errosPorCampo, setErrosPorCampo] = useState<Record<string, string>>({})

  const temErroDeCampo = Object.keys(errosPorCampo).length > 0

  const categoriasDoTipo = useMemo(() => categorias.filter((categoria) => categoria.tipo === tipo), [categorias, tipo])

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro('')
    setErrosPorCampo({})

    if (categoriaId === '') {
      setErro('Selecione uma categoria')
      return
    }

    setSalvando(true)
    try {
      await aoSalvar({
        descricao,
        valor: Number(valor),
        tipo,
        categoriaId,
        dataTransacao,
      })
    } catch (excecao) {
      const falha = ErroDeFormulario.de(excecao, 'Não foi possível salvar a transação')
      setErro(falha.message)
      setErrosPorCampo(falha.porCampo)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={aoSubmeter} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
          <input
            value={descricao}
            onChange={(evento) => setDescricao(evento.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="Ex: Supermercado"
          />
          <ErroDeCampo mensagem={errosPorCampo.descricao} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
          <select
            value={tipo}
            onChange={(evento) => {
              setTipo(evento.target.value as TipoTransacao)
              setCategoriaId('')
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="DESPESA">Despesa</option>
            <option value="RECEITA">Receita</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={valor}
            onChange={(evento) => setValor(evento.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="0,00"
          />
          <ErroDeCampo mensagem={errosPorCampo.valor} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Categoria</label>
          <select
            value={categoriaId}
            onChange={(evento) => setCategoriaId(Number(evento.target.value))}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="" disabled>
              Selecione...
            </option>
            {categoriasDoTipo.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
          <ErroDeCampo mensagem={errosPorCampo.categoriaId} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Data</label>
          <input
            type="date"
            value={dataTransacao}
            onChange={(evento) => setDataTransacao(evento.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <ErroDeCampo mensagem={errosPorCampo.dataTransacao} />
        </div>
      </div>

      {erro && !temErroDeCampo && <p className="mt-3 text-sm text-red-600">{erro}</p>}

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
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
