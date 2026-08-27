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
