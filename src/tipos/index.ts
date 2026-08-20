export type TipoTransacao = 'RECEITA' | 'DESPESA'

export interface Usuario {
  nome: string
  email: string
}

export interface Categoria {
  id: number
  nome: string
  tipo: TipoTransacao
}

export interface Transacao {
  id: number
  descricao: string
  valor: number
  tipo: TipoTransacao
  dataTransacao: string
  categoriaId: number
  nomeCategoria: string
}

export interface Saldo {
  totalReceitas: number
  totalDespesas: number
  saldo: number
}

export interface ErroApi {
  status: number
  mensagem: string
  erros: Record<string, string>
}
