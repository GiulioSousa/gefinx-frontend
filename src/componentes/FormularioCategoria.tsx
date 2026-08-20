import { useState, type FormEvent } from 'react'
import type { Categoria, TipoTransacao } from '../tipos'
import { ErroDeFormulario } from '../api/erros'
import { ErroDeCampo } from './ErroDeCampo'

interface FormularioCategoriaProps {
  categoriaInicial?: Categoria
  aoSalvar: (nome: string, tipo: TipoTransacao) => Promise<void>
  aoCancelar: () => void
}

export function FormularioCategoria({ categoriaInicial, aoSalvar, aoCancelar }: FormularioCategoriaProps) {
  const [nome, setNome] = useState(categoriaInicial?.nome ?? '')
  const [tipo, setTipo] = useState<TipoTransacao>(categoriaInicial?.tipo ?? 'DESPESA')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [errosPorCampo, setErrosPorCampo] = useState<Record<string, string>>({})

  const temErroDeCampo = Object.keys(errosPorCampo).length > 0

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro('')
    setErrosPorCampo({})
    setSalvando(true)
    try {
      await aoSalvar(nome, tipo)
    } catch (excecao) {
      const falha = ErroDeFormulario.de(excecao, 'Não foi possível salvar a categoria')
      setErro(falha.message)
      setErrosPorCampo(falha.porCampo)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={aoSubmeter} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
          <input
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="Ex: Educação"
          />
          <ErroDeCampo mensagem={errosPorCampo.nome} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
          <select
            value={tipo}
            onChange={(evento) => setTipo(evento.target.value as TipoTransacao)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="DESPESA">Despesa</option>
            <option value="RECEITA">Receita</option>
          </select>
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
