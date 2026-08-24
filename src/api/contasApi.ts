import { clienteApi } from './clienteApi'
import type { Conta } from '../tipos'

export interface DadosConta {
  nome: string
  saldoInicial?: number
}

export async function listarContas(): Promise<Conta[]> {
  const { data } = await clienteApi.get<Conta[]>('/contas')
  return data
}

export async function criarConta(dados: DadosConta): Promise<Conta> {
  const { data } = await clienteApi.post<Conta>('/contas', dados)
  return data
}

export async function atualizarConta(id: number, nome: string): Promise<Conta> {
  const { data } = await clienteApi.put<Conta>(`/contas/${id}`, { nome })
  return data
}

export async function excluirConta(id: number): Promise<void> {
  await clienteApi.delete(`/contas/${id}`)
}
