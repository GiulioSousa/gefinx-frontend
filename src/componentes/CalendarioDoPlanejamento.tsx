import { useEffect, useState, type FormEvent } from 'react'
import type { CalendarioDoAno, FeriadoDoAno, PeriodoSemTrabalho } from '../tipos'
import * as planejamentoApi from '../api/planejamentoApi'
import { ErroDeFormulario, extrairMensagemErro } from '../api/erros'
import { ErroDeCampo } from './ErroDeCampo'

const CAMPO =
  'w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm dark:text-slate-100 focus:border-emerald-500 focus:outline-none'

const ROTULO = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300'

const BOTAO_PEQUENO =
  'shrink-0 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'

const SETA =
  'rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800'

/** Os mesmos limites do servidor. */
const PRIMEIRO_ANO = 2000
const ULTIMO_ANO = 2100

function formatarDia(data: string): string {
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

function ehDomingo(data: string): boolean {
  return new Date(`${data}T00:00:00`).getDay() === 0
}

function descreverPeriodo(periodo: PeriodoSemTrabalho): string {
  const dias = periodo.inicio === periodo.fim ? formatarDia(periodo.inicio) : `${formatarDia(periodo.inicio)} a ${formatarDia(periodo.fim)}`
  return `${dias} · ${periodo.descricao ?? 'Dia sem trabalho'}`
}

interface CalendarioDoPlanejamentoProps {
  /** O dia do servidor: decide o ano que abre e quais feriados já passaram. */
  hoje: string
  /** Chamado a cada mudança salva, para o plano ser recalculado por trás da janela. */
  aoMudar: () => void
  aoFechar: () => void
}

/**
 * Os dias que não contam para a meta. Os feriados nacionais vêm calculados e entram sozinhos;
 * o que se faz aqui é ignorar um — o dia em que se decidiu trabalhar — e cadastrar o que a
 * lista nacional não tem: feriado da cidade, folga, férias.
 *
 * Cada mudança vale na hora, sem um Salvar no fim: são escolhas soltas, e a meta por trás da
 * janela já se recalcula com cada uma.
 */
export function CalendarioDoPlanejamento({ hoje, aoMudar, aoFechar }: CalendarioDoPlanejamentoProps) {
  const [ano, setAno] = useState(() => Number(hoje.slice(0, 4)))
  const [calendario, setCalendario] = useState<CalendarioDoAno | null>(null)
  const [erro, setErro] = useState('')
  // A data ou o id do item sendo mudado, para travar só o botão dele.
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    let atual = true
    planejamentoApi
      .buscarCalendario(ano)
      .then((obtido) => {
        if (atual) {
          setCalendario(obtido)
        }
      })
      .catch((excecao) => {
        if (atual) {
          setErro(extrairMensagemErro(excecao, 'Não foi possível carregar o calendário'))
        }
      })
    // Trocar de ano rápido não deixa a resposta do ano anterior chegar por cima.
    return () => {
      atual = false
    }
  }, [ano, recarga])

  function depoisDeMudar() {
    setRecarga((atual) => atual + 1)
    aoMudar()
  }

  async function alternarFeriado(feriado: FeriadoDoAno) {
    setErro('')
    setOcupado(feriado.data)
    try {
      if (feriado.ignorado) {
        await planejamentoApi.considerarFeriado(feriado.data)
      } else {
        await planejamentoApi.ignorarFeriado(feriado.data)
      }
      depoisDeMudar()
    } catch (excecao) {
      setErro(extrairMensagemErro(excecao, 'Não foi possível mudar o feriado'))
    } finally {
      setOcupado(null)
    }
  }

  async function excluirPeriodo(periodo: PeriodoSemTrabalho) {
    setErro('')
    setOcupado(`periodo-${periodo.id}`)
    try {
      await planejamentoApi.excluirPeriodoSemTrabalho(periodo.id)
      depoisDeMudar()
    } catch (excecao) {
      setErro(extrairMensagemErro(excecao, 'Não foi possível excluir o período'))
    } finally {
      setOcupado(null)
    }
  }

  function trocarAno(novo: number) {
    setErro('')
    setCalendario(null)
    setAno(novo)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => trocarAno(ano - 1)}
          disabled={ano <= PRIMEIRO_ANO}
          aria-label="Ano anterior"
          className={SETA}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="min-w-12 text-center text-sm font-semibold text-slate-900 dark:text-slate-100" aria-live="polite">
          {ano}
        </span>
        <button
          type="button"
          onClick={() => trocarAno(ano + 1)}
          disabled={ano >= ULTIMO_ANO}
          aria-label="Próximo ano"
          className={SETA}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

      {!calendario ? (
        !erro && <p className="text-sm text-slate-500 dark:text-slate-400">Carregando...</p>
      ) : (
        <>
          <section aria-labelledby="titulo-feriados" className="space-y-2">
            <h3 id="titulo-feriados" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Feriados nacionais
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Não contam como dia de trabalho na meta. Ignore os dias em que você vai trabalhar.
            </p>
            <ul className="divide-y divide-slate-900/5 dark:divide-white/5">
              {calendario.feriados.map((feriado) => (
                <LinhaDoFeriado
                  key={feriado.data}
                  feriado={feriado}
                  passou={feriado.data < hoje}
                  ocupado={ocupado === feriado.data}
                  aoAlternar={() => alternarFeriado(feriado)}
                />
              ))}
            </ul>
          </section>

          <section aria-labelledby="titulo-dias-sem-trabalho" className="space-y-2">
            <h3 id="titulo-dias-sem-trabalho" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Dias sem trabalho
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Feriado da cidade, folga, férias: os dias de trabalho dentro deles saem da meta.
            </p>
            {calendario.periodos.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum em {ano}.</p>
            ) : (
              <ul className="divide-y divide-slate-900/5 dark:divide-white/5">
                {calendario.periodos.map((periodo) => (
                  <li key={periodo.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="text-sm text-slate-900 dark:text-slate-100">{descreverPeriodo(periodo)}</span>
                    <button
                      type="button"
                      onClick={() => excluirPeriodo(periodo)}
                      disabled={ocupado === `periodo-${periodo.id}`}
                      aria-label={`Excluir ${descreverPeriodo(periodo)}`}
                      className={BOTAO_PEQUENO}
                    >
                      Excluir
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <FormularioDePeriodo aoAdicionar={depoisDeMudar} />
          </section>
        </>
      )}

      <button
        type="button"
        onClick={aoFechar}
        className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Fechar
      </button>
    </div>
  )
}

/**
 * O feriado no domingo não tem botão: ele já não contaria, e ignorá-lo não mudaria nada. O que
 * já passou também não — a meta só olha para a frente.
 */
function LinhaDoFeriado({
  feriado,
  passou,
  ocupado,
  aoAlternar,
}: {
  feriado: FeriadoDoAno
  passou: boolean
  ocupado: boolean
  aoAlternar: () => void
}) {
  const domingo = ehDomingo(feriado.data)
  const semEfeito = domingo || passou

  return (
    <li className={`flex items-center justify-between gap-3 py-2 ${passou ? 'opacity-60' : ''}`}>
      <div className="min-w-0">
        <p className="text-sm text-slate-900 dark:text-slate-100">
          <span className="text-slate-500 dark:text-slate-400">{formatarDia(feriado.data)}</span> · {feriado.nome}
        </p>
        {feriado.ignorado && !semEfeito && (
          <p className="text-xs text-emerald-700 dark:text-emerald-400">Ignorado: conta como dia de trabalho</p>
        )}
      </div>
      {domingo ? (
        <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">cai no domingo</span>
      ) : passou ? (
        <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">já passou</span>
      ) : (
        <button
          type="button"
          onClick={aoAlternar}
          disabled={ocupado}
          aria-label={`${feriado.ignorado ? 'Considerar' : 'Ignorar'} ${feriado.nome}`}
          className={BOTAO_PEQUENO}
        >
          {feriado.ignorado ? 'Considerar' : 'Ignorar'}
        </button>
      )}
    </li>
  )
}

/** "Até" vazio é um dia só. Os erros do servidor voltam embaixo do campo que os causou. */
function FormularioDePeriodo({ aoAdicionar }: { aoAdicionar: () => void }) {
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [descricao, setDescricao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [errosPorCampo, setErrosPorCampo] = useState<Record<string, string>>({})

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro('')
    setErrosPorCampo({})
    setSalvando(true)
    try {
      await planejamentoApi.adicionarPeriodoSemTrabalho({
        inicio,
        fim: fim || undefined,
        descricao: descricao.trim() || undefined,
      })
      setInicio('')
      setFim('')
      setDescricao('')
      aoAdicionar()
    } catch (excecao) {
      const falha = ErroDeFormulario.de(excecao, 'Não foi possível adicionar o período')
      setErro(falha.message)
      setErrosPorCampo(falha.porCampo)
    } finally {
      setSalvando(false)
    }
  }

  const temErroDeCampo = Object.keys(errosPorCampo).length > 0

  return (
    <form onSubmit={aoSubmeter} className="space-y-3 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="periodo-inicio" className={ROTULO}>
            De
          </label>
          <input
            id="periodo-inicio"
            type="date"
            value={inicio}
            onChange={(evento) => setInicio(evento.target.value)}
            required
            className={CAMPO}
          />
          <ErroDeCampo mensagem={errosPorCampo.inicio} />
        </div>
        <div>
          <label htmlFor="periodo-fim" className={ROTULO}>
            Até <span className="font-normal text-slate-500 dark:text-slate-400">(opcional)</span>
          </label>
          <input
            id="periodo-fim"
            type="date"
            value={fim}
            min={inicio || undefined}
            onChange={(evento) => setFim(evento.target.value)}
            className={CAMPO}
          />
          <ErroDeCampo mensagem={errosPorCampo.fim} />
        </div>
      </div>
      <div>
        <label htmlFor="periodo-descricao" className={ROTULO}>
          Descrição <span className="font-normal text-slate-500 dark:text-slate-400">(opcional)</span>
        </label>
        <input
          id="periodo-descricao"
          value={descricao}
          onChange={(evento) => setDescricao(evento.target.value)}
          maxLength={100}
          placeholder="Ex: Férias, feriado da cidade"
          className={CAMPO}
        />
        <ErroDeCampo mensagem={errosPorCampo.descricao} />
      </div>

      {erro && !temErroDeCampo && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

      <button
        type="submit"
        disabled={salvando}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {salvando ? 'Adicionando...' : 'Adicionar'}
      </button>
    </form>
  )
}
