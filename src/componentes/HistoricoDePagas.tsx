import { useEffect, useState } from 'react'
import type { DespesaPaga } from '../tipos'
import { listarDespesasPagas } from '../api/planejamentoApi'
import { extrairMensagemErro } from '../api/erros'
import { VIDRO } from './vidro'

/** Poucas por vez: o histórico fica abaixo do plano, e quem abre quer ver as últimas. */
const TAMANHO_DA_PAGINA = 10

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Com o ano: ao contrário dos prazos do plano, o histórico atravessa anos. */
function formatarData(data: string): string {
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR')
}

/** A diferença entre o pago e o planejado, só quando houve. */
function Diferenca({ despesa }: { despesa: DespesaPaga }) {
  if (despesa.valorPago === null || despesa.valorPago === despesa.valorPlanejado) {
    return null
  }
  const diferenca = Math.abs(despesa.valorPago - despesa.valorPlanejado)
  const sentido = despesa.valorPago > despesa.valorPlanejado ? 'a mais' : 'a menos'
  return (
    <span className="block text-sm text-slate-600 dark:text-slate-300">
      Planejado: {formatarMoeda(despesa.valorPlanejado)} — {formatarMoeda(diferenca)} {sentido}.
    </span>
  )
}

/**
 * As despesas planejadas já pagas. Fechado por padrão, e só busca ao abrir: o plano é o que se
 * consulta todo dia, o histórico não.
 *
 * `versao` muda quando o plano muda — um pagamento novo, uma transação excluída —, e o
 * histórico aberto volta à primeira página para refletir isso.
 */
export function HistoricoDePagas({ versao }: { versao: number }) {
  const [aberto, setAberto] = useState(false)
  const [pagas, setPagas] = useState<DespesaPaga[]>([])
  const [pagina, setPagina] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(0)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!aberto) {
      return
    }
    let cancelado = false

    async function carregarPrimeira() {
      setCarregando(true)
      setErro('')
      try {
        const resultado = await listarDespesasPagas(0, TAMANHO_DA_PAGINA)
        if (!cancelado) {
          setPagas(resultado.itens)
          setPagina(0)
          setTotalPaginas(resultado.totalPaginas)
        }
      } catch (excecao) {
        if (!cancelado) {
          setErro(extrairMensagemErro(excecao, 'Não foi possível carregar as despesas pagas'))
        }
      } finally {
        if (!cancelado) {
          setCarregando(false)
        }
      }
    }

    carregarPrimeira()
    return () => {
      cancelado = true
    }
  }, [aberto, versao])

  async function mostrarMais() {
    setCarregando(true)
    setErro('')
    try {
      const resultado = await listarDespesasPagas(pagina + 1, TAMANHO_DA_PAGINA)
      setPagas((atuais) => [...atuais, ...resultado.itens])
      setPagina(resultado.pagina)
      setTotalPaginas(resultado.totalPaginas)
    } catch (excecao) {
      setErro(extrairMensagemErro(excecao, 'Não foi possível carregar mais despesas pagas'))
    } finally {
      setCarregando(false)
    }
  }

  return (
    <section aria-labelledby="titulo-pagas" className="space-y-3">
      {/* O botão vai dentro do título, e não o contrário: título não pode morar em botão. */}
      <h2 id="titulo-pagas" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        <button
          type="button"
          onClick={() => setAberto((atual) => !atual)}
          aria-expanded={aberto}
          aria-controls="lista-pagas"
          className="flex w-full items-center justify-between gap-3 rounded-md text-left"
        >
          Pagas
          <svg
            className={`h-5 w-5 shrink-0 text-slate-500 transition-transform dark:text-slate-400 ${aberto ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </h2>

      {aberto && (
        <div id="lista-pagas" className="space-y-3">
          {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

          {!erro && !carregando && pagas.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nenhuma despesa paga ainda. Ao marcar uma despesa como paga, ela sai do plano e aparece aqui.
            </p>
          )}

          {pagas.length > 0 && (
            <ul className="space-y-3">
              {pagas.map((despesa) => (
                <li key={despesa.id} className={`space-y-1 rounded-lg p-4 ${VIDRO}`}>
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{despesa.descricao}</span>
                    <span className="shrink-0 font-semibold text-slate-900 dark:text-slate-100">
                      {formatarMoeda(despesa.valorPago ?? despesa.valorPlanejado)}
                    </span>
                  </span>

                  {despesa.dataPagamento === null ? (
                    <span className="block text-sm text-slate-500 dark:text-slate-400">
                      Prazo {formatarData(despesa.prazo)}. O pagamento não foi encontrado.
                    </span>
                  ) : (
                    <>
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                        paga em {formatarData(despesa.dataPagamento)}
                        {despesa.pagaComAtraso && (
                          <span className="rounded-full border border-current px-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                            Após o prazo, {formatarData(despesa.prazo)}
                          </span>
                        )}
                      </span>
                      {/* Linha própria: emendadas à data, quebravam com o separador no começo da linha. */}
                      <span className="block text-sm text-slate-500 dark:text-slate-400">
                        {[despesa.conta, despesa.categoria].filter(Boolean).join(' · ')}
                      </span>
                    </>
                  )}

                  <Diferenca despesa={despesa} />
                </li>
              ))}
            </ul>
          )}

          {carregando && <p className="text-sm text-slate-500 dark:text-slate-400">Carregando...</p>}

          {!carregando && pagina + 1 < totalPaginas && (
            <button
              type="button"
              onClick={mostrarMais}
              className="w-full rounded-md p-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Mostrar mais
            </button>
          )}
        </div>
      )}
    </section>
  )
}
