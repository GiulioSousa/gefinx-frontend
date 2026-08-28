export type TipoTransacao = 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'

/** Categoria nunca é TRANSFERENCIA: esse tipo pertence só à transação. */
export type TipoCategoria = 'RECEITA' | 'DESPESA'

export interface Usuario {
  nome: string
  email: string
}

export interface Categoria {
  id: number
  nome: string
  tipo: TipoCategoria
}

export interface Conta {
  id: number
  nome: string
  saldo: number
}

export interface Transacao {
  id: number
  descricao: string
  valor: number
  tipo: TipoTransacao
  dataTransacao: string
  categoriaId: number | null
  nomeCategoria: string | null
  contaId: number
  nomeConta: string
  contaDestinoId: number | null
  nomeContaDestino: string | null
}

export interface Saldo {
  totalReceitas: number
  totalDespesas: number
  totalTransferencias: number
  saldo: number
}

export interface ErroApi {
  status: number
  mensagem: string
  erros: Record<string, string>
}

/** O envelope de uma listagem paginada, como a API o devolve. */
export interface Pagina<T> {
  itens: T[]
  pagina: number
  tamanho: number
  totalItens: number
  totalPaginas: number
}

/**
 * Os recortes da listagem de transações. Todo campo é opcional, e ausente significa
 * "não filtra por isso"; os preenchidos se somam.
 *
 * As datas são inclusivas nas duas pontas, no formato ISO que a API espera.
 */
export interface FiltroTransacoes {
  dataInicio?: string
  dataFim?: string
  tipo?: TipoTransacao
  contaId?: number
  categoriaId?: number
}
