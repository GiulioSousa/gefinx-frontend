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

export async function listarContasDoPlanejamento(): Promise<ContaDoPlanejamento[]> {
  const { data } = await clienteApi.get<ContaDoPlanejamento[]>('/planejamento/contas')
  return data
}

/** Manda a escolha inteira: as contas que não estiverem na lista entram no planejamento. */
export async function definirContasDeFora(contasDeFora: number[]): Promise<ContaDoPlanejamento[]> {
  const { data } = await clienteApi.put<ContaDoPlanejamento[]>('/planejamento/contas', { contasDeFora })
  return data
}
