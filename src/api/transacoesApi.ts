import { clienteApi } from './clienteApi'
import type { Saldo, TipoTransacao, Transacao } from '../tipos'

export interface DadosTransacao {
  descricao: string
  valor: number
  tipo: TipoTransacao
  categoriaId: number
  dataTransacao: string
}

export async function listarTransacoes(): Promise<Transacao[]> {
  const { data } = await clienteApi.get<Transacao[]>('/transacoes')
  return data
}

export async function criarTransacao(dados: DadosTransacao): Promise<Transacao> {
  const { data } = await clienteApi.post<Transacao>('/transacoes', dados)
  return data
}

export async function atualizarTransacao(id: number, dados: DadosTransacao): Promise<Transacao> {
  const { data } = await clienteApi.put<Transacao>(`/transacoes/${id}`, dados)
  return data
}

export async function excluirTransacao(id: number): Promise<void> {
  await clienteApi.delete(`/transacoes/${id}`)
}

export async function buscarSaldo(): Promise<Saldo> {
  const { data } = await clienteApi.get<Saldo>('/saldo')
  return data
}
