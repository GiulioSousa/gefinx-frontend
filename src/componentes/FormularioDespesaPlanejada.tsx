import { useState, type FormEvent } from 'react'
import type { DespesaPlanejada, Recorrencia } from '../tipos'
import type { DadosDespesaPlanejada } from '../api/planejamentoApi'
import { ErroDeFormulario } from '../api/erros'
import { CampoDeValor } from './CampoDeValor'
import { ErroDeCampo } from './ErroDeCampo'

const CAMPO =
  'w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm dark:text-slate-100 focus:border-emerald-500 focus:outline-none'

const REPETICOES: { valor: Recorrencia | null; rotulo: string }[] = [
  { valor: null, rotulo: 'Não repete' },
  { valor: 'SEMANAL', rotulo: 'Toda semana' },
  { valor: 'MENSAL', rotulo: 'Todo mês' },
]

interface FormularioDespesaPlanejadaProps {
  despesaInicial?: DespesaPlanejada
  /** `serie`: a edição vale também para as outras pendentes da série. Só na edição de uma recorrente. */
  aoSalvar: (dados: DadosDespesaPlanejada, serie: boolean) => Promise<void>
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
  const [recorrencia, setRecorrencia] = useState<Recorrencia | null>(despesaInicial?.recorrencia ?? null)
  // A que menos muda vem marcada: só esta ocorrência.
  const [naSerie, setNaSerie] = useState(false)
  const editandoSerie = Boolean(despesaInicial?.recorrencia)
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
      await aoSalvar({ descricao, valor: centavos / 100, prazo, recorrencia }, editandoSerie && naSerie)
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

        {/* À vista, como o tipo da transação: são só três, e escondê-las numa lista faria a
            repetição passar despercebida no cadastro. */}
        <fieldset className="sm:col-span-2">
          <legend className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Repete</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {REPETICOES.map((opcao) => (
              <label
                key={opcao.valor ?? 'nao'}
                className="flex items-center gap-2 py-1 text-sm text-slate-700 dark:text-slate-300"
              >
                <input
                  type="radio"
                  name="recorrencia"
                  value={opcao.valor ?? 'NAO_REPETE'}
                  checked={recorrencia === opcao.valor}
                  onChange={() => setRecorrencia(opcao.valor)}
                  className="h-4 w-4 accent-emerald-600 dark:accent-emerald-400"
                />
                {opcao.rotulo}
              </label>
            ))}
          </div>
          <ErroDeCampo mensagem={errosPorCampo.recorrencia} />
        </fieldset>

        {editandoSerie && (
          <fieldset className="sm:col-span-2">
            <legend className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Aplicar a</legend>
            <div className="space-y-2">
              {[
                { valor: false, rotulo: 'Somente esta ocorrência', descricao: 'As outras ocorrências ficam como estão.' },
                {
                  valor: true,
                  rotulo: 'Todas as ocorrências pendentes',
                  descricao:
                    despesaInicial?.recorrencia === 'MENSAL'
                      ? 'Se o prazo mudar, as outras passam para o mesmo dia do mês. As pagas não mudam.'
                      : 'Se o prazo mudar, as outras andam os mesmos dias. As pagas não mudam.',
                },
              ].map((opcao) => (
                <label
                  key={String(opcao.valor)}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-300 p-3 has-checked:border-emerald-600 dark:border-slate-700 dark:has-checked:border-emerald-400"
                >
                  <input
                    type="radio"
                    name="aplicar"
                    value={opcao.valor ? 'SERIE' : 'ESTA'}
                    checked={naSerie === opcao.valor}
                    onChange={() => setNaSerie(opcao.valor)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600 dark:accent-emerald-400"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">{opcao.rotulo}</span>
                    <span className="block text-sm text-slate-600 dark:text-slate-300">{opcao.descricao}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      {recorrencia && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Ao marcar como paga, a próxima entra no plano com o mesmo valor, {recorrencia === 'SEMANAL' ? 'uma semana' : 'um mês'}{' '}
          depois do prazo. Se a conta vier diferente, edite a próxima.
        </p>
      )}

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
