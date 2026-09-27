import { useMemo, useState, type FormEvent } from 'react'
import type { Categoria, Conta, DespesaPlanejada } from '../tipos'
import type { DadosPagamento } from '../api/planejamentoApi'
import { ErroDeFormulario } from '../api/erros'
import { CampoDeValor } from './CampoDeValor'
import { ErroDeCampo } from './ErroDeCampo'

const CAMPO =
  'w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm dark:text-slate-100 focus:border-emerald-500 focus:outline-none'

interface FormularioPagamentoProps {
  despesa: DespesaPlanejada
  /** O dia que o servidor considera hoje, e não o do aparelho: é o mesmo dia do plano. */
  hoje: string
  categorias: Categoria[]
  contas: Conta[]
  aoSalvar: (dados: DadosPagamento) => Promise<void>
  aoCancelar: () => void
}

/**
 * A transação que paga uma despesa planejada, já preenchida com o que se planejou. Valor e
 * data continuam editáveis: paga-se às vezes um pouco diferente do previsto, e em outro dia.
 * O tipo não aparece — é sempre despesa.
 */
export function FormularioPagamento({ despesa, hoje, categorias, contas, aoSalvar, aoCancelar }: FormularioPagamentoProps) {
  const [descricao, setDescricao] = useState(despesa.descricao)
  const [centavos, setCentavos] = useState(Math.round(despesa.valor * 100))
  const [dataTransacao, setDataTransacao] = useState(hoje)
  const [categoriaId, setCategoriaId] = useState<number | ''>('')
  // Como no formulário de transação: com uma conta só não há escolha a fazer, e com duas ou
  // mais escolher pelo usuário lançaria o pagamento na conta errada em silêncio.
  const [contaId, setContaId] = useState<number | ''>(contas.length === 1 ? contas[0].id : '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [errosPorCampo, setErrosPorCampo] = useState<Record<string, string>>({})

  const categoriasDeDespesa = useMemo(() => categorias.filter((categoria) => categoria.tipo === 'DESPESA'), [categorias])
  const temErroDeCampo = Object.keys(errosPorCampo).length > 0

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro('')
    setErrosPorCampo({})
    if (categoriaId === '' || contaId === '') {
      setErro('Selecione a categoria e a conta')
      return
    }
    setSalvando(true)
    try {
      await aoSalvar({ descricao, valor: centavos / 100, dataTransacao, categoriaId, contaId })
    } catch (excecao) {
      const falha = ErroDeFormulario.de(excecao, 'Não foi possível registrar o pagamento')
      setErro(falha.message)
      setErrosPorCampo(falha.porCampo)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={aoSubmeter}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Descrição</label>
          <input
            value={descricao}
            onChange={(evento) => setDescricao(evento.target.value)}
            required
            maxLength={200}
            className={CAMPO}
          />
          <ErroDeCampo mensagem={errosPorCampo.descricao} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Valor pago</label>
          <CampoDeValor centavos={centavos} aoMudar={setCentavos} required className={CAMPO} />
          <ErroDeCampo mensagem={errosPorCampo.valor} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Data</label>
          <input
            type="date"
            value={dataTransacao}
            onChange={(evento) => setDataTransacao(evento.target.value)}
            required
            className={CAMPO}
          />
          <ErroDeCampo mensagem={errosPorCampo.dataTransacao} />
        </div>

        {/* O foco começa aqui, e não na descrição: ela já vem certa, e a categoria é o que falta. */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Categoria</label>
          <select
            value={categoriaId}
            onChange={(evento) => setCategoriaId(Number(evento.target.value))}
            required
            data-foco-inicial
            className={CAMPO}
          >
            <option value="" disabled>
              Selecione...
            </option>
            {categoriasDeDespesa.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
          <ErroDeCampo mensagem={errosPorCampo.categoriaId} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Conta</label>
          <select value={contaId} onChange={(evento) => setContaId(Number(evento.target.value))} required className={CAMPO}>
            <option value="" disabled>
              Selecione...
            </option>
            {contas.map((conta) => (
              <option key={conta.id} value={conta.id}>
                {conta.nome}
              </option>
            ))}
          </select>
          <ErroDeCampo mensagem={errosPorCampo.contaId} />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        O pagamento entra como despesa em Transações, e a despesa sai do planejamento. Para desfazer, exclua a
        transação: a despesa volta.
      </p>

      {erro && !temErroDeCampo && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{erro}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {salvando ? 'Registrando...' : 'Registrar pagamento'}
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
