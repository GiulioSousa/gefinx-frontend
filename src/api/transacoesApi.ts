import { clienteApi } from './clienteApi'
import type { FiltroTransacoes, Pagina, Saldo, TipoTransacao, Transacao } from '../tipos'

/**
 * `categoriaId` e `contaDestinoId` são mutuamente exclusivos, conforme o tipo:
 * transferência leva destino e não leva categoria; receita e despesa, o inverso.
 */
export interface DadosTransacao {
  descricao: string
  valor: number
  tipo: TipoTransacao
  categoriaId?: number
  contaId: number
  contaDestinoId?: number
  dataTransacao: string
}

/**
 * A listagem, paginada. `pagina` conta a partir de zero, como a API.
 *
 * Campo vazio do filtro é omitido da URL em vez de ir como string vazia: a API distingue
 * "sem filtro" de "filtro vazio", e `?tipo=` seria um valor inválido para o enum — recusado
 * com 400 quando a intenção era não filtrar nada.
 */
export async function listarTransacoes(
  pagina = 0,
  tamanho = 20,
  filtro: FiltroTransacoes = {},
  signal?: AbortSignal,
): Promise<Pagina<Transacao>> {
  const parametros: Record<string, string | number> = { pagina, tamanho }

  for (const [chave, valor] of Object.entries(filtro)) {
    if (valor !== undefined && valor !== '') {
      parametros[chave] = valor
    }
  }

  const { data } = await clienteApi.get<Pagina<Transacao>>('/transacoes', {
    params: parametros,
    signal,
  })
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
