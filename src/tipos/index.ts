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

/**
 * De quanto em quanto tempo a despesa volta. Paga, a que se repete põe a próxima no plano, com o
 * mesmo valor e o prazo uma semana ou um mês adiante.
 */
export type Recorrencia = 'SEMANAL' | 'MENSAL'

/**
 * As cores que uma etiqueta pode ter: nomes, e não códigos de cor. O tom de cada uma, nos dois
 * temas, fica em `componentes/etiquetas.tsx`.
 */
export type CorDaEtiqueta =
  | 'ROXO'
  | 'INDIGO'
  | 'AZUL'
  | 'CIANO'
  | 'VERDE'
  | 'AMBAR'
  | 'LARANJA'
  | 'VERMELHO'
  | 'ROSA'
  | 'CINZA'

/**
 * A marca de uma despesa planejada — de que cartão é a compra. Só visual. `despesas` é quantas
 * ela marca, pendentes e pagas: o que fica sem etiqueta se ela for excluída.
 */
export interface Etiqueta {
  id: number
  nome: string
  cor: CorDaEtiqueta
  despesas: number
}

/** Um pagamento que ainda vai acontecer. Não é transação, e não mexe no saldo. */
export interface DespesaPlanejada {
  id: number
  descricao: string
  valor: number
  prazo: string
  /** Nula na despesa que não se repete. */
  recorrencia: Recorrencia | null
  /** "2 de 6": o número desta ocorrência e o total; a série para na última. Nulos se não é parcelada. */
  parcela: number | null
  totalDeParcelas: number | null
  /** Nula na despesa sem etiqueta. */
  etiquetaId: number | null
}

/**
 * - `VENCE_HOJE`: o prazo é hoje, esteja ela coberta ou não.
 * - `COBERTA`: o saldo de agora paga esta despesa e todas as que vencem antes dela.
 * - `EM_ANDAMENTO`: falta dinheiro, e há dias de trabalho até o prazo.
 * - `SEM_DIAS_DE_TRABALHO`: falta dinheiro e não sobra dia de trabalho antes do prazo, que
 *   ainda não chegou — hoje é domingo e ela vence na segunda, por exemplo.
 * - `ATRASADA`: o prazo passou e ela não foi paga, mesmo que o saldo já a cubra.
 *
 * `ATRASADA` e `VENCE_HOJE`, nessa ordem, ganham do resto: ter o dinheiro não paga a conta, e o
 * prazo de hoje ou de antes é o que pede ação. Quem decide é o servidor.
 */
export type SituacaoDaDespesa =
  | 'VENCE_HOJE'
  | 'COBERTA'
  | 'EM_ANDAMENTO'
  | 'SEM_DIAS_DE_TRABALHO'
  | 'ATRASADA'

/**
 * Uma despesa dentro do plano. As despesas disputam o mesmo saldo, por ordem de prazo:
 * `acumulado` é a soma desta com as que vencem antes, e `falta` é o que o saldo de agora não
 * cobre desse acumulado — por isso pode passar do valor da própria despesa.
 *
 * `porDia` é nulo quando não há dias por onde dividir: coberta, atrasada, vencendo hoje ou
 * sem dia de trabalho. Nas três últimas, o que falta entra inteiro na meta, como `pendente` do
 * plano, e o `porDia` das seguintes já o desconta.
 */
export interface ItemDoPlanejamento extends DespesaPlanejada {
  acumulado: number
  falta: number
  diasDeTrabalho: number
  porDia: number | null
  situacao: SituacaoDaDespesa
}

/** O que se gastou numa categoria nos 30 dias, em quantos dias distintos, e a média por esses dias. */
export interface MediaDaCategoria {
  categoriaId: number
  total: number
  diasComGasto: number
  porDia: number
}

/**
 * O gasto do dia a dia que a meta cobre, olhando os 30 dias até ontem (`inicio` a `fim`): cada
 * categoria escolhida dividida pelos dias em que houve gasto nela, e `porDia` a soma dessas
 * médias. `categorias` vem da maior média para a menor. Não é despesa planejada: não tem prazo
 * nem pagamento, porque o gasto de verdade já é lançado.
 */
export interface CustoDiario {
  inicio: string
  fim: string
  total: number
  porDia: number
  categorias: MediaDaCategoria[]
}

/**
 * O plano do dia, calculado pelo servidor. `hoje` é o dia que ele considerou, no fuso
 * configurado. A meta acompanha cada lançamento: é quanto ainda falta ganhar por dia, contando
 * o resto de hoje, e já inclui o custo diário. `receitasDeHoje` é a soma das receitas do dia,
 * sem descontar despesas.
 *
 * `pendente` é a parte da meta que não se divide por dias: o que falta das despesas atrasadas
 * ou sem dia de trabalho até o prazo. Fica somado à meta enquanto elas não forem pagas.
 *
 * `custoDiario` é nulo quando nenhuma categoria foi escolhida.
 *
 * `folgaDeHoje` é o motivo de hoje não contar como dia de trabalho — "Domingo", o nome do
 * feriado, a descrição do período —, e nulo quando conta.
 */
export interface Planejamento {
  hoje: string
  saldoAtual: number
  receitasDeHoje: number
  metaDiaria: number
  pendente: number
  custoDiario: CustoDiario | null
  prazoDecisivo: string | null
  folgaDeHoje: string | null
  itens: ItemDoPlanejamento[]
}

/** Uma categoria de despesa, e se o gasto dela entra no custo diário da meta. */
export interface CategoriaDoPlanejamento {
  id: number
  nome: string
  entraNoCustoDiario: boolean
}

/**
 * Uma despesa do histórico: o que se planejou e o que de fato se pagou, que costumam
 * divergir. Os campos do pagamento só vêm nulos se a transação foi excluída enquanto a página
 * era montada — e excluí-la devolve a despesa ao plano, de onde ela reaparece.
 *
 * `pagaComAtraso` é pagar depois do prazo; no dia do prazo ainda não é atraso.
 */
export interface DespesaPaga {
  id: number
  descricao: string
  valorPlanejado: number
  prazo: string
  transacaoId: number
  valorPago: number | null
  dataPagamento: string | null
  conta: string | null
  categoria: string | null
  pagaComAtraso: boolean
  recorrencia: Recorrencia | null
  parcela: number | null
  totalDeParcelas: number | null
  etiquetaId: number | null
}

/**
 * O que houve com a próxima ocorrência ao desfazer um pagamento: não havia (`NENHUMA`), saiu do
 * plano por estar como nasceu (`REMOVIDA`), ou ficou por já ter sido editada (`MANTIDA`).
 */
export type DesfechoDaProxima = 'NENHUMA' | 'REMOVIDA' | 'MANTIDA' | 'MANTIDA_NO_PERIODO'

/** Um feriado nacional do ano. `ignorado` é o dia em que se decidiu trabalhar: ele volta a contar. */
export interface FeriadoDoAno {
  data: string
  nome: string
  ignorado: boolean
}

/** Feriado local, folga, férias. Um dia só tem `inicio` e `fim` iguais; os dois contam. */
export interface PeriodoSemTrabalho {
  id: number
  inicio: string
  fim: string
  descricao: string | null
}

/** Os feriados do ano, e os períodos que tocam o ano, inclusive os que o atravessam. */
export interface CalendarioDoAno {
  ano: number
  feriados: FeriadoDoAno[]
  periodos: PeriodoSemTrabalho[]
}

export interface ContaDoPlanejamento {
  id: number
  nome: string
  entraNoPlanejamento: boolean
}

/**
 * Um mês do relatório. `mes` vem como `2026-10`. Transferências não entram: dinheiro que só
 * troca de conta não é receita nem despesa. `saldoAoFim` é o consolidado no último dia do mês.
 */
export interface MesDoRelatorio {
  mes: string
  receitas: number
  despesas: number
  resultado: number
  saldoAoFim: number
}

export interface TotalDaCategoria {
  categoriaId: number
  nome: string
  total: number
}
