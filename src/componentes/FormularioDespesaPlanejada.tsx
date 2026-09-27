import { useState, type FormEvent } from 'react'
import type { DespesaPlanejada } from '../tipos'
import type { DadosDespesaPlanejada } from '../api/planejamentoApi'
import { ErroDeFormulario } from '../api/erros'
import { CampoDeValor } from './CampoDeValor'
import { ErroDeCampo } from './ErroDeCampo'

const CAMPO =
  'w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm dark:text-slate-100 focus:border-emerald-500 focus:outline-none'

interface FormularioDespesaPlanejadaProps {
  despesaInicial?: DespesaPlanejada
  aoSalvar: (dados: DadosDespesaPlanejada) => Promise<void>
  aoCancelar: () => void
}

/**
 * O prazo não tem mínimo. A API aceita data passada — uma despesa vencida e não paga ainda
 * precisa ser editada —, e barrar aqui só na criação faria as duas telas discordarem.
 */
export function FormularioDespesaPlanejada({ despesaInicial, aoSalvar, aoCancelar }: FormularioDespesaPlanejadaProps) {
  const [descricao, setDescricao] = useState(despesaInicial?.descricao ?? '')
  const [centavos, setCentavos] = useState(despesaInicial ? Math.round(despesaInicial.valor * 100) : 0)
  const [prazo, setPrazo] = useState(despesaInicial?.prazo ?? '')
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
      await aoSalvar({ descricao, valor: centavos / 100, prazo })
    } catch (excecao) {
      const falha = ErroDeFormulario.de(excecao, 'Não foi possível salvar a despesa')
      setErro(falha.message)
      setErrosPorCampo(falha.porCampo)
    } finally {
      setSalvando(false)
    }
  }

  return (
    // Sem cartão próprio: abre dentro do Modal, que já é o vidro em volta.
    <form onSubmit={aoSubmeter}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Descrição</label>
          <input
            value={descricao}
            onChange={(evento) => setDescricao(evento.target.value)}
            required
            maxLength={200}
            data-foco-inicial
            className={CAMPO}
            placeholder="Ex: Aluguel"
          />
          <ErroDeCampo mensagem={errosPorCampo.descricao} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Valor</label>
          <CampoDeValor centavos={centavos} aoMudar={setCentavos} required className={CAMPO} />
          <ErroDeCampo mensagem={errosPorCampo.valor} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Pagar até</label>
          <input
            type="date"
            value={prazo}
            onChange={(evento) => setPrazo(evento.target.value)}
            required
            className={CAMPO}
          />
          <ErroDeCampo mensagem={errosPorCampo.prazo} />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        O dia do prazo não conta como dia de trabalho: o que se ganha nele pode chegar depois do pagamento.
      </p>

      {erro && !temErroDeCampo && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{erro}</p>}

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
