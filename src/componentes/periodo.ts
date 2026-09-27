/*
  Os recortes de data que o painel e a lista de transações oferecem à vista: um mês do
  calendário, ou os últimos 7, 15 ou 30 dias. Viram `dataInicio`/`dataFim` antes de sair
  para a API, que só conhece datas — o "mês" e os "dias" são uma conveniência da tela.

  Todas as contas são feitas no fuso de quem usa. "Hoje" e "este mês" são perguntas sobre o
  calendário da pessoa, e não sobre o do servidor.
*/

export const DIAS_RECENTES = [7, 15, 30] as const

export type DiasRecentes = (typeof DIAS_RECENTES)[number]

/** `mes` conta a partir de zero, como o `Date`, para as contas de calendário não precisarem de ajuste. */
export type Periodo =
  | { tipo: 'mes'; ano: number; mes: number }
  | { tipo: 'dias'; dias: DiasRecentes }

export interface Intervalo {
  dataInicio: string
  dataFim: string
}

/**
 * A data no calendário local, no formato ISO que a API espera.
 *
 * `toISOString` não serve para isso: ele converte para UTC antes de formatar, e no Brasil,
 * das 21h à meia-noite, já é o dia seguinte em UTC. Um lançamento feito às 22h do último dia
 * do mês cairia no mês seguinte, e sumiria justamente do mês em que foi feito.
 */
export function dataLocal(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function mesAtual(hoje = new Date()): Periodo {
  return { tipo: 'mes', ano: hoje.getFullYear(), mes: hoje.getMonth() }
}

/** O mês anterior (`-1`) ou o seguinte (`1`); o `Date` cuida da virada de ano. */
export function mesVizinho(ano: number, mes: number, passo: -1 | 1): Periodo {
  const data = new Date(ano, mes + passo, 1)
  return { tipo: 'mes', ano: data.getFullYear(), mes: data.getMonth() }
}

/**
 * As duas pontas do período, inclusivas, como a API as recebe.
 *
 * Os últimos N dias contam hoje: "últimos 7 dias" são hoje e os seis anteriores. Deixar hoje
 * de fora esconderia o gasto que acabou de ser lançado, que é o primeiro que se procura.
 */
export function intervaloDoPeriodo(periodo: Periodo, hoje = new Date()): Intervalo {
  if (periodo.tipo === 'mes') {
    return {
      dataInicio: dataLocal(new Date(periodo.ano, periodo.mes, 1)),
      // O dia zero do mês seguinte é o último deste: o `Date` resolve 28, 29, 30 ou 31.
      dataFim: dataLocal(new Date(periodo.ano, periodo.mes + 1, 0)),
    }
  }

  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (periodo.dias - 1))
  return { dataInicio: dataLocal(inicio), dataFim: dataLocal(hoje) }
}

/** "Setembro de 2026". */
export function nomeDoMes(ano: number, mes: number): string {
  const nome = new Date(ano, mes, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return nome.charAt(0).toUpperCase() + nome.slice(1)
}

function formatarData(data: string): string {
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR')
}

/** O recorte por extenso, para quando ele não é um mês: com uma ponta, com as duas ou sem nenhuma. */
export function descreverIntervalo(dataInicio?: string, dataFim?: string): string {
  if (dataInicio && dataFim) {
    return `${formatarData(dataInicio)} a ${formatarData(dataFim)}`
  }
  if (dataInicio) {
    return `A partir de ${formatarData(dataInicio)}`
  }
  if (dataFim) {
    return `Até ${formatarData(dataFim)}`
  }
  return 'Todo o histórico'
}
