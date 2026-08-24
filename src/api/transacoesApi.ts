import { clienteApi } from './clienteApi'
import type { Saldo, TipoTransacao, Transacao } from '../tipos'

export interface DadosTransacao {
  descricao: string
  valor: number
  tipo: TipoTransacao
  categoriaId: number
  contaId: number
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

/** Sem `contaId`, o consolidado de todas as contas; com ele, só aquela conta. */
export async function buscarSaldo(contaId?: number): Promise<Saldo> {
  const { data } = await clienteApi.get<Saldo>('/saldo', {
    params: contaId === undefined ? undefined : { contaId },
  })
  return data
}
