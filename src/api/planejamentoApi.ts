import { clienteApi } from './clienteApi'
import type { CalendarioDoAno, ContaDoPlanejamento, DesfechoDaProxima, DespesaPaga, DespesaPlanejada, Pagina, PeriodoSemTrabalho, Planejamento, Recorrencia } from '../tipos'

export interface DadosDespesaPlanejada {
  descricao: string
  valor: number
  prazo: string
  /** Ausente ou nula: não se repete. */
  recorrencia?: Recorrencia | null
  /** Juntos ou nenhum, e só na que se repete: "2 de 6". */
  parcela?: number | null
  totalDeParcelas?: number | null
}

export async function buscarPlanejamento(): Promise<Planejamento> {
  const { data } = await clienteApi.get<Planejamento>('/planejamento')
  return data
}

export async function criarDespesaPlanejada(dados: DadosDespesaPlanejada): Promise<DespesaPlanejada> {
  const { data } = await clienteApi.post<DespesaPlanejada>('/despesas-planejadas', dados)
  return data
}

/** Na recorrente, `serie` leva a mudança às outras pendentes da série; sem ele, só a esta ocorrência. */
export async function atualizarDespesaPlanejada(
  id: number,
  dados: DadosDespesaPlanejada,
  serie = false,
): Promise<DespesaPlanejada> {
  const { data } = await clienteApi.put<DespesaPlanejada>(`/despesas-planejadas/${id}`, dados, {
    params: serie ? { serie: true } : undefined,
  })
  return data
}

/** Na recorrente, `serie` tira todas as pendentes da série; sem ele, só esta ocorrência. */
export async function excluirDespesaPlanejada(id: number, serie = false): Promise<void> {
  await clienteApi.delete(`/despesas-planejadas/${id}`, { params: serie ? { serie: true } : undefined })
}

/** A transação que paga a despesa. O tipo é sempre despesa, e por isso não vai no corpo. */
export interface DadosPagamento {
  descricao: string
  valor: number
  dataTransacao: string
  categoriaId: number
  contaId: number
}

/**
 * Lança a despesa e tira a planejada do plano, numa operação só no servidor. Devolve o id da
 * transação: excluí-la em Transações desfaz o pagamento, e a despesa volta ao plano.
 */
export async function pagarDespesaPlanejada(id: number, dados: DadosPagamento): Promise<number> {
  const { data } = await clienteApi.post<{ transacaoId: number }>(`/despesas-planejadas/${id}/pagamento`, dados)
  return data.transacaoId
}

/** O histórico, do prazo mais recente para o mais antigo. */
export async function listarDespesasPagas(pagina: number, tamanho: number): Promise<Pagina<DespesaPaga>> {
  const { data } = await clienteApi.get<Pagina<DespesaPaga>>('/despesas-planejadas/pagas', { params: { pagina, tamanho } })
  return data
}

/**
 * Exclui a transação do pagamento e devolve a despesa ao plano. Se ela se repete, a próxima
 * ocorrência sai junto quando ainda está como nasceu. Recusado com 409 se a próxima já foi paga.
 */
export async function desfazerPagamento(id: number): Promise<DesfechoDaProxima> {
  const { data } = await clienteApi.delete<{ proxima: DesfechoDaProxima }>(`/despesas-planejadas/${id}/pagamento`)
  return data.proxima
}

export async function listarContasDoPlanejamento(): Promise<ContaDoPlanejamento[]> {
  const { data } = await clienteApi.get<ContaDoPlanejamento[]>('/planejamento/contas')
  return data
}

/** Manda a escolha inteira: as contas que não estiverem na lista entram no planejamento. */
export async function definirContasDeFora(contasDeFora: number[]): Promise<ContaDoPlanejamento[]> {
  const { data } = await clienteApi.put<ContaDoPlanejamento[]>('/planejamento/contas', { contasDeFora })
  return data
}

export async function buscarCalendario(ano: number): Promise<CalendarioDoAno> {
  const { data } = await clienteApi.get<CalendarioDoAno>('/planejamento/calendario', { params: { ano } })
  return data
}

/** O feriado ignorado volta a contar como dia de trabalho. Repetir não muda nada. */
export async function ignorarFeriado(data: string): Promise<void> {
  await clienteApi.put(`/planejamento/calendario/feriados-ignorados/${data}`)
}

export async function considerarFeriado(data: string): Promise<void> {
  await clienteApi.delete(`/planejamento/calendario/feriados-ignorados/${data}`)
}

/** Sem `fim`, é um dia só. */
export interface DadosPeriodoSemTrabalho {
  inicio: string
  fim?: string
  descricao?: string
}

export async function adicionarPeriodoSemTrabalho(dados: DadosPeriodoSemTrabalho): Promise<PeriodoSemTrabalho> {
  const { data } = await clienteApi.post<PeriodoSemTrabalho>('/planejamento/calendario/periodos', dados)
  return data
}

export async function excluirPeriodoSemTrabalho(id: number): Promise<void> {
  await clienteApi.delete(`/planejamento/calendario/periodos/${id}`)
}
