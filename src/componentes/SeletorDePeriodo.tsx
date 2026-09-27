import { useId } from 'react'
import { BOLHA, VIDRO } from './vidro'
import {
  DIAS_RECENTES,
  descreverIntervalo,
  intervaloDoPeriodo,
  mesAtual,
  mesVizinho,
  nomeDoMes,
  type DiasRecentes,
  type Periodo,
} from './periodo'

const OPCOES: { rotulo: string; dias?: DiasRecentes }[] = [
  { rotulo: 'Mês' },
  ...DIAS_RECENTES.map((dias) => ({ rotulo: `${dias} dias`, dias })),
]

interface SeletorDePeriodoProps {
  /** `null` quando o recorte não é nenhum dos atalhos: datas escolhidas à mão, ou nenhuma. */
  periodo: Periodo | null
  aoMudar: (periodo: Periodo) => void
  /** O que a segunda linha diz quando `periodo` é `null`. */
  descricaoForaDosAtalhos?: string
}

function Seta({ direcao }: { direcao: 'anterior' | 'seguinte' }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points={direcao === 'anterior' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
    </svg>
  )
}

const BOTAO_DE_SETA =
  'rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'

/**
 * O período, em duas linhas: os atalhos à vista, e embaixo o que eles significam agora — no
 * mês, as setas para os meses vizinhos; nos últimos dias, as datas por extenso. "Últimos 7
 * dias" sozinho não diz se hoje entra, e a data escrita encerra a dúvida.
 *
 * Os atalhos são botões de rádio, como o tipo no formulário de transação: são exclusivos
 * entre si, e as setas do teclado já andam entre eles sem código próprio. A bolha e as cores
 * são as da aba ativa na barra do celular, com os contrastes que a PALETA.md registra para
 * ela — sobre o mesmo vidro, valem os mesmos números.
 *
 * Tocar em "Mês" vindo dos últimos dias volta ao mês corrente, e não ao último mês visto:
 * é o ponto de partida da tela, e o único que dispensa lembrar de onde se veio.
 */
export function SeletorDePeriodo({ periodo, aoMudar, descricaoForaDosAtalhos = '' }: SeletorDePeriodoProps) {
  const grupo = useId()

  function descricao(): string {
    if (periodo === null) {
      return descricaoForaDosAtalhos
    }
    const { dataInicio, dataFim } = intervaloDoPeriodo(periodo)
    return descreverIntervalo(dataInicio, dataFim)
  }

  return (
    <div className="flex w-full flex-col gap-1 sm:w-auto">
      <fieldset>
        <legend className="sr-only">Período</legend>
        <div className={`flex rounded-full p-1 ${VIDRO}`}>
          {OPCOES.map((opcao) => {
            const marcada =
              opcao.dias === undefined
                ? periodo?.tipo === 'mes'
                : periodo?.tipo === 'dias' && periodo.dias === opcao.dias

            return (
              <label
                key={opcao.rotulo}
                className={`flex-1 cursor-pointer rounded-full px-3 py-1.5 text-center text-sm whitespace-nowrap transition-colors has-focus-visible:outline-2 has-focus-visible:outline-emerald-500 ${
                  marcada
                    ? `${BOLHA} font-semibold text-emerald-700 dark:text-emerald-400`
                    : 'font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name={grupo}
                  checked={marcada}
                  onChange={() =>
                    aoMudar(opcao.dias === undefined ? mesAtual() : { tipo: 'dias', dias: opcao.dias })
                  }
                  className="sr-only"
                />
                {opcao.rotulo}
              </label>
            )
          })}
        </div>
      </fieldset>

      {/* Altura fixa: trocar as setas pelas datas não pode empurrar o que vem abaixo. */}
      <div className="flex h-9 items-center justify-between gap-2">
        {periodo?.tipo === 'mes' ? (
          <>
            <button
              type="button"
              onClick={() => aoMudar(mesVizinho(periodo.ano, periodo.mes, -1))}
              aria-label="Mês anterior"
              title="Mês anterior"
              className={BOTAO_DE_SETA}
            >
              <Seta direcao="anterior" />
            </button>
            <p aria-live="polite" className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {nomeDoMes(periodo.ano, periodo.mes)}
            </p>
            <button
              type="button"
              onClick={() => aoMudar(mesVizinho(periodo.ano, periodo.mes, 1))}
              aria-label="Próximo mês"
              title="Próximo mês"
              className={BOTAO_DE_SETA}
            >
              <Seta direcao="seguinte" />
            </button>
          </>
        ) : (
          <p aria-live="polite" className="w-full text-center text-sm text-slate-500 dark:text-slate-400">
            {descricao()}
          </p>
        )}
      </div>
    </div>
  )
}
