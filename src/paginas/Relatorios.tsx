import { useEffect, useId, useState } from 'react'
import type { MesDoRelatorio, TotalDaCategoria } from '../tipos'
import { buscarRelatorioMensal, buscarTotaisPorCategoria } from '../api/relatoriosApi'
import { extrairMensagemErro } from '../api/erros'
import { BOLHA, VIDRO } from '../componentes/vidro'

type Tipo = 'RECEITA' | 'DESPESA'

const QUANTIDADES = [6, 12] as const
type Quantidade = (typeof QUANTIDADES)[number]

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
/** Os rótulos do eixo: "5 mil" cabe numa coluna estreita, "R$ 5.000,00" não. */
const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

/*
  As cores das barras foram conferidas pelo validador de paleta (skill dataviz), contra a
  superfície de cada tema: emerald-600 com red-600 no claro (ΔE 9,0 para deuteranopia) e
  emerald-600 com red-500 no escuro (ΔE 10,1). Os tons de texto do escuro, emerald-400 e
  red-400, ficam claros demais para preenchimento e reprovam na faixa de luminosidade.
  Mesmo passando, a cor nunca é o único canal: há legenda, o tooltip diz o nome, e a tabela
  abaixo traz todos os números.
*/
const COR: Record<Tipo, string> = {
  RECEITA: 'bg-emerald-600',
  DESPESA: 'bg-red-600 dark:bg-red-500',
}
const ROTULO: Record<Tipo, string> = { RECEITA: 'Receitas', DESPESA: 'Despesas' }

function formatarMoeda(valor: number): string {
  return moeda.format(valor)
}

function dataDoMes(mes: string): Date {
  const [ano, numero] = mes.split('-').map(Number)
  return new Date(ano, numero - 1, 1)
}

function mesCurto(mes: string): string {
  return dataDoMes(mes).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
}

function mesPorExtenso(mes: string): string {
  return dataDoMes(mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

/** "out 2026": a coluna do mês na tabela, estreita para sobrar lugar aos valores no celular. */
function mesDaTabela(mes: string): string {
  return `${mesCurto(mes)} ${dataDoMes(mes).getFullYear()}`
}

/** Só a primeira letra: o `capitalize` do CSS faria "Outubro De 2026". */
function comMaiuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** `2026-10`, do calendário de quem está olhando — o mesmo critério do seletor do Painel. */
function chaveDoMes(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
}

function intervalo(quantidade: Quantidade): { inicio: string; fim: string } {
  const hoje = new Date()
  return {
    inicio: chaveDoMes(new Date(hoje.getFullYear(), hoje.getMonth() - (quantidade - 1), 1)),
    fim: chaveDoMes(hoje),
  }
}

/** O topo do eixo: o maior valor arredondado para cima em 1, 2 ou 5 vezes uma potência de 10. */
function topoDoEixo(maior: number): number {
  if (maior <= 0) {
    return 100
  }
  const potencia = 10 ** Math.floor(Math.log10(maior))
  const passo = [1, 2, 5, 10].find((multiplo) => multiplo * potencia >= maior) ?? 10
  return passo * potencia
}

export function Relatorios() {
  const [quantidade, setQuantidade] = useState<Quantidade>(12)
  const [meses, setMeses] = useState<MesDoRelatorio[] | null>(null)
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [atualizando, setAtualizando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      const { inicio, fim } = intervalo(quantidade)
      try {
        const resultado = await buscarRelatorioMensal(inicio, fim)
        if (!cancelado) {
          setMeses(resultado)
          setErro('')
          // O mês escolhido continua escolhido se ainda está no intervalo; senão, o atual.
          setSelecionado((atual) => (atual && resultado.some((item) => item.mes === atual) ? atual : fim))
        }
      } catch (excecao) {
        if (!cancelado) {
          setErro(extrairMensagemErro(excecao, 'Não foi possível carregar o relatório'))
        }
      } finally {
        if (!cancelado) {
          setAtualizando(false)
        }
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [quantidade])

  function escolherQuantidade(nova: Quantidade) {
    if (nova !== quantidade) {
      setAtualizando(true)
      setQuantidade(nova)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Relatório mensal</h1>
        <SeletorDeQuantidade quantidade={quantidade} aoMudar={escolherQuantidade} />
      </div>

      {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

      {meses === null && !erro && <p className="text-slate-500 dark:text-slate-400">Carregando...</p>}

      {meses && (
        <div aria-busy={atualizando} className={`space-y-6 transition-opacity ${atualizando ? 'opacity-60' : ''}`}>
          <GraficoMensal meses={meses} selecionado={selecionado} aoSelecionar={setSelecionado} />
          <TabelaMensal meses={meses} selecionado={selecionado} aoSelecionar={setSelecionado} />
          {selecionado && <TotaisPorCategoria mes={selecionado} />}
        </div>
      )}
    </div>
  )
}

function SeletorDeQuantidade({ quantidade, aoMudar }: { quantidade: Quantidade; aoMudar: (nova: Quantidade) => void }) {
  const grupo = useId()
  return (
    <fieldset>
      <legend className="sr-only">Quantidade de meses</legend>
      <div className={`flex rounded-full p-1 ${VIDRO}`}>
        {QUANTIDADES.map((opcao) => {
          const marcada = opcao === quantidade
          return (
            <label
              key={opcao}
              className={`flex-1 cursor-pointer rounded-full px-3 py-1.5 text-center text-sm whitespace-nowrap transition-colors has-focus-visible:outline-2 has-focus-visible:outline-emerald-500 ${
                marcada
                  ? `${BOLHA} font-semibold text-emerald-700 dark:text-emerald-400`
                  : 'font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
              }`}
            >
              <input type="radio" name={grupo} checked={marcada} onChange={() => aoMudar(opcao)} className="sr-only" />
              {opcao} meses
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

interface PropsDosMeses {
  meses: MesDoRelatorio[]
  selecionado: string | null
  aoSelecionar: (mes: string) => void
}

/**
 * Colunas agrupadas, receita ao lado de despesa, num eixo só. O saldo não entra aqui: ele está
 * noutra escala, e pô-lo junto pediria um segundo eixo vertical — que faz duas grandezas
 * parecerem comparáveis quando não são. Ele mora na tabela, logo abaixo.
 *
 * Cada mês é um botão do tamanho da sua faixa inteira: o alvo do toque e do foco é a faixa, e
 * não a barra, que num mês de pouco movimento teria poucos pixels.
 */
function GraficoMensal({ meses, selecionado, aoSelecionar }: PropsDosMeses) {
  const [destacado, setDestacado] = useState<number | null>(null)
  const topo = topoDoEixo(Math.max(...meses.map((mes) => Math.max(mes.receitas, mes.despesas))))
  const marcas = [topo, topo / 2, 0]
  const emFoco = destacado === null ? null : meses[destacado]

  return (
    <section aria-labelledby="titulo-grafico" className={`space-y-3 rounded-lg p-4 sm:p-5 ${VIDRO}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="titulo-grafico" className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Receitas e despesas
        </h2>
        <ul className="flex gap-4 text-sm text-slate-600 dark:text-slate-300">
          {(['RECEITA', 'DESPESA'] as const).map((tipo) => (
            <li key={tipo} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={`h-3 w-3 rounded-sm ${COR[tipo]}`} />
              {ROTULO[tipo]}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2">
        {/* Eixo: só três marcas, arredondadas. Os valores exatos estão no tooltip e na tabela. */}
        <div aria-hidden="true" className="relative h-44 w-10 shrink-0 text-right text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
          {marcas.map((marca) => (
            <span key={marca} className="absolute right-0 -translate-y-1/2" style={{ top: `${100 - (marca / topo) * 100}%` }}>
              {compacto.format(marca)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-44">
            {marcas.map((marca) => (
              <div
                key={marca}
                className="absolute inset-x-0 border-t border-slate-900/10 dark:border-white/10"
                style={{ top: `${100 - (marca / topo) * 100}%` }}
              />
            ))}
          </div>

          <div className="relative flex" onPointerLeave={() => setDestacado(null)}>
            {meses.map((mes, indice) => {
              const marcado = mes.mes === selecionado
              // Com 12 meses abaixo de 360px os nomes se encostam: fica um sim, um não, contando
              // do mais recente, que sempre aparece. O nome inteiro segue no aria-label e na tabela.
              const rotuloAlternado = meses.length > 6 && (meses.length - 1 - indice) % 2 === 1
              return (
                <button
                  key={mes.mes}
                  type="button"
                  onClick={() => aoSelecionar(mes.mes)}
                  onPointerEnter={() => setDestacado(indice)}
                  onFocus={() => setDestacado(indice)}
                  onBlur={() => setDestacado(null)}
                  aria-pressed={marcado}
                  aria-label={`${mesPorExtenso(mes.mes)}: receitas ${formatarMoeda(mes.receitas)}, despesas ${formatarMoeda(mes.despesas)}`}
                  className={`flex min-w-0 flex-1 flex-col items-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                    marcado ? 'bg-slate-900/5 dark:bg-white/10' : 'hover:bg-slate-900/[0.03] dark:hover:bg-white/5'
                  }`}
                >
                  {/* gap-0.5: os 2px de superfície entre as duas barras do mês. */}
                  <span className="flex h-44 w-full items-end justify-center gap-0.5">
                    {(['RECEITA', 'DESPESA'] as const).map((tipo) => {
                      const valor = tipo === 'RECEITA' ? mes.receitas : mes.despesas
                      return (
                        <span
                          key={tipo}
                          className={`w-full max-w-3 rounded-t-[4px] sm:max-w-5 ${COR[tipo]}`}
                          style={{ height: `${(valor / topo) * 100}%` }}
                        />
                      )
                    })}
                  </span>
                  <span
                    className={`mt-1 text-[11px] ${rotuloAlternado ? 'max-[359px]:invisible' : ''} ${
                      marcado ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {mesCurto(mes.mes)}
                  </span>
                </button>
              )
            })}

            {emFoco && destacado !== null && (
              <Dica mes={emFoco} posicao={(destacado + 0.5) / meses.length} />
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">Toque num mês para ver as categorias dele.</p>
    </section>
  )
}

/**
 * O valor vem antes do nome, ao contrário da legenda: aqui a série já se sabe pela linha de
 * cor, e o que se procura é o número. Encostada na borda quando o mês está na ponta, para não
 * sair do cartão.
 *
 * Sem o VIDRO: ele traz `relative`, que vence o `absolute` e punha a dica na fila dos meses,
 * fora do cartão. O material é parecido, mas quase opaco, porque a dica passa por cima das barras.
 */
function Dica({ mes, posicao }: { mes: MesDoRelatorio; posicao: number }) {
  const deslocamento = posicao < 0.25 ? '0%' : posicao > 0.75 ? '-100%' : '-50%'
  return (
    <div
      role="presentation"
      className="pointer-events-none absolute top-0 z-10 w-max rounded-md border border-white/70 bg-white/95 p-2 text-sm shadow-lg backdrop-blur-sm dark:border-white/15 dark:bg-slate-900/95"
      style={{ left: `${posicao * 100}%`, transform: `translateX(${deslocamento})` }}
    >
      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{comMaiuscula(mesPorExtenso(mes.mes))}</p>
      {(['RECEITA', 'DESPESA'] as const).map((tipo) => (
        <p key={tipo} className="flex items-center gap-2">
          <span aria-hidden="true" className={`h-0.5 w-3 rounded-full ${COR[tipo]}`} />
          <span className="font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {formatarMoeda(tipo === 'RECEITA' ? mes.receitas : mes.despesas)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{ROTULO[tipo]}</span>
        </p>
      ))}
    </div>
  )
}

/**
 * Os mesmos números do gráfico, e o saldo com que cada mês terminou. É a leitura completa sem
 * depender de cor nem de passar o dedo: o gráfico mostra a forma, a tabela os valores.
 */
function TabelaMensal({ meses, selecionado, aoSelecionar }: PropsDosMeses) {
  const celula = 'px-2 py-2 text-right tabular-nums whitespace-nowrap sm:px-3'
  return (
    <section aria-labelledby="titulo-tabela" className={`rounded-lg ${VIDRO}`}>
      <h2 id="titulo-tabela" className="px-4 pt-4 text-base font-semibold text-slate-900 sm:px-5 dark:text-slate-100">
        Mês a mês
      </h2>
      {/*
        Abaixo de `sm` o resultado sai: é receitas menos despesas, as duas na mesma linha, e
        sem ele as quatro colunas cabem em 375px — com ele, o saldo no fim, que é o que só a
        tabela mostra, ficava escondido atrás da rolagem. A rolagem fica como reserva para
        valores na casa dos milhões, e só dentro do cartão.
      */}
      <div className="mt-2 overflow-x-auto pb-2">
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500 dark:text-slate-400">
            <tr>
              <th scope="col" className="py-2 pr-2 pl-3 text-left font-medium sm:pl-5">Mês</th>
              <th scope="col" className="px-2 py-2 text-right font-medium sm:px-3">Receitas</th>
              <th scope="col" className="px-2 py-2 text-right font-medium sm:px-3">Despesas</th>
              <th scope="col" className="hidden px-2 py-2 text-right font-medium sm:table-cell sm:px-3">Resultado</th>
              <th scope="col" className="py-2 pr-3 pl-2 text-right font-medium sm:pr-5 sm:pl-3">Saldo no fim</th>
            </tr>
          </thead>
          <tbody>
            {[...meses].reverse().map((mes) => {
              const marcado = mes.mes === selecionado
              return (
                <tr
                  key={mes.mes}
                  className={`border-t border-slate-900/5 dark:border-white/5 ${marcado ? 'bg-slate-900/5 dark:bg-white/10' : ''}`}
                >
                  <th scope="row" className="py-2 pr-2 pl-3 text-left font-normal whitespace-nowrap sm:pl-5">
                    <button
                      type="button"
                      onClick={() => aoSelecionar(mes.mes)}
                      aria-pressed={marcado}
                      aria-label={comMaiuscula(mesPorExtenso(mes.mes))}
                      className={`underline-offset-2 hover:underline ${
                        marcado ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {mesDaTabela(mes.mes)}
                    </button>
                  </th>
                  <td className={`${celula} text-slate-700 dark:text-slate-300`}>{formatarMoeda(mes.receitas)}</td>
                  <td className={`${celula} text-slate-700 dark:text-slate-300`}>{formatarMoeda(mes.despesas)}</td>
                  <td className={`${celula} hidden sm:table-cell ${mes.resultado < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                    {formatarMoeda(mes.resultado)}
                  </td>
                  <td className={`${celula} pr-3 font-medium text-slate-900 sm:pr-5 dark:text-slate-100`}>{formatarMoeda(mes.saldoAoFim)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/**
 * Parte do todo de um mês: cada categoria com o seu total e a fatia do mês. Uma cor só — a do
 * tipo —, porque o que distingue as linhas é o nome escrito ao lado, e não um matiz por
 * categoria, que passaria das oito cores que se consegue separar.
 */
function TotaisPorCategoria({ mes }: { mes: string }) {
  const [tipo, setTipo] = useState<Tipo>('DESPESA')
  const [totais, setTotais] = useState<TotalDaCategoria[] | null>(null)
  const [erro, setErro] = useState('')
  const grupo = useId()

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const resultado = await buscarTotaisPorCategoria(mes, tipo)
        if (!cancelado) {
          setTotais(resultado)
          setErro('')
        }
      } catch (excecao) {
        if (!cancelado) {
          setErro(extrairMensagemErro(excecao, 'Não foi possível carregar as categorias'))
        }
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [mes, tipo])

  const soma = totais?.reduce((acumulado, item) => acumulado + item.total, 0) ?? 0

  return (
    <section aria-labelledby="titulo-categorias" className={`space-y-4 rounded-lg p-4 sm:p-5 ${VIDRO}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="titulo-categorias" className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Por categoria em <span className="whitespace-nowrap">{mesPorExtenso(mes)}</span>
        </h2>
        <fieldset>
          <legend className="sr-only">Tipo</legend>
          <div className={`flex rounded-full p-1 ${VIDRO}`}>
            {(['DESPESA', 'RECEITA'] as const).map((opcao) => {
              const marcada = opcao === tipo
              return (
                <label
                  key={opcao}
                  className={`flex-1 cursor-pointer rounded-full px-3 py-1.5 text-center text-sm whitespace-nowrap transition-colors has-focus-visible:outline-2 has-focus-visible:outline-emerald-500 ${
                    marcada
                      ? `${BOLHA} font-semibold text-emerald-700 dark:text-emerald-400`
                      : 'font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
                  }`}
                >
                  <input type="radio" name={grupo} checked={marcada} onChange={() => setTipo(opcao)} className="sr-only" />
                  {ROTULO[opcao]}
                </label>
              )
            })}
          </div>
        </fieldset>
      </div>

      {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

      {totais && totais.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Nenhuma {tipo === 'DESPESA' ? 'despesa' : 'receita'} neste mês.
        </p>
      )}

      {totais && totais.length > 0 && (
        <ul className="space-y-3">
          {totais.map((item) => {
            const fatia = soma > 0 ? (item.total / soma) * 100 : 0
            return (
              <li key={item.categoriaId} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-slate-700 dark:text-slate-300">{item.nome}</span>
                  <span className="shrink-0 tabular-nums">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{formatarMoeda(item.total)}</span>
                    <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">{Math.round(fatia)}%</span>
                  </span>
                </div>
                <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10">
                  <div className={`h-full rounded-full ${COR[tipo]}`} style={{ width: `${fatia}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
