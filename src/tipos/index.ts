export type TipoTransacao = 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'

/** Categoria nunca é TRANSFERENCIA: esse tipo pertence só à transação. */
export type TipoCategoria = 'RECEITA' | 'DESPESA'

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

/**
 * Os recortes do saldo, com o mesmo contrato das datas da listagem. Sem nenhum, o saldo de
 * sempre; com período, os totais e o `saldo` descrevem só o que aconteceu nele — o `saldo`
 * passa a ser o resultado do período, e não o acumulado até a data.
 */
export interface FiltroSaldo {
  contaId?: number
  dataInicio?: string
  dataFim?: string
}

/** Um pagamento que ainda vai acontecer. Não é transação, e não mexe no saldo. */
export interface DespesaPlanejada {
  id: number
  descricao: string
  valor: number
  prazo: string
}

/**
 * - `COBERTA`: o saldo de agora paga esta despesa e todas as que vencem antes dela.
 * - `EM_ANDAMENTO`: falta dinheiro, e há dias de trabalho até o prazo.
 * - `SEM_DIAS_DE_TRABALHO`: falta dinheiro e não sobra dia de trabalho antes do prazo.
 * - `ATRASADA`: o prazo passou e ela não foi paga, mesmo que o saldo já a cubra.
 */
export type SituacaoDaDespesa = 'COBERTA' | 'EM_ANDAMENTO' | 'SEM_DIAS_DE_TRABALHO' | 'ATRASADA'

/**
 * Uma despesa dentro do plano. As despesas disputam o mesmo saldo, por ordem de prazo:
 * `acumulado` é a soma desta com as que vencem antes, e `falta` é o que o saldo de agora não
 * cobre desse acumulado — por isso pode passar do valor da própria despesa.
 *
 * `porDia` é nulo quando ela não entra na meta: coberta, atrasada ou sem dia de trabalho.
 */
export interface ItemDoPlanejamento extends DespesaPlanejada {
  acumulado: number
  falta: number
  diasDeTrabalho: number
  porDia: number | null
  situacao: SituacaoDaDespesa
}

/**
 * O plano do dia, calculado pelo servidor. `hoje` é o dia que ele considerou, no fuso
 * configurado. A meta sai do saldo do fim de ontem e fica parada durante o dia; o ganho de
 * hoje é o saldo de agora menos o de ontem, e `restanteHoje` o que ainda falta dele.
 */
export interface Planejamento {
  hoje: string
  saldoDeOntem: number
  saldoAtual: number
  ganhoDeHoje: number
  metaDiaria: number
  restanteHoje: number
  prazoDecisivo: string | null
  itens: ItemDoPlanejamento[]
}

export interface ContaDoPlanejamento {
  id: number
  nome: string
  entraNoPlanejamento: boolean
}
