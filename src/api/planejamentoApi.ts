import { clienteApi } from './clienteApi'
import type { ContaDoPlanejamento, DespesaPlanejada, Planejamento } from '../tipos'

export interface DadosDespesaPlanejada {
  descricao: string
  valor: number
  prazo: string
}

export async function buscarPlanejamento(): Promise<Planejamento> {
  const { data } = await clienteApi.get<Planejamento>('/planejamento')
  return data
}

export async function criarDespesaPlanejada(dados: DadosDespesaPlanejada): Promise<DespesaPlanejada> {
  const { data } = await clienteApi.post<DespesaPlanejada>('/despesas-planejadas', dados)
  return data
}

export async function atualizarDespesaPlanejada(id: number, dados: DadosDespesaPlanejada): Promise<DespesaPlanejada> {
  const { data } = await clienteApi.put<DespesaPlanejada>(`/despesas-planejadas/${id}`, dados)
  return data
}

export async function excluirDespesaPlanejada(id: number): Promise<void> {
  await clienteApi.delete(`/despesas-planejadas/${id}`)
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

export async function listarContasDoPlanejamento(): Promise<ContaDoPlanejamento[]> {
  const { data } = await clienteApi.get<ContaDoPlanejamento[]>('/planejamento/contas')
  return data
}

/** Manda a escolha inteira: as contas que não estiverem na lista entram no planejamento. */
export async function definirContasDeFora(contasDeFora: number[]): Promise<ContaDoPlanejamento[]> {
  const { data } = await clienteApi.put<ContaDoPlanejamento[]>('/planejamento/contas', { contasDeFora })
  return data
}
