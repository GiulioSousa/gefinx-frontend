import type { TipoTransacao } from '../tipos'

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * O valor de um lançamento, com a cor e o sinal que o tipo dele pede.
 *
 * Transferência fica em cinza e sem sinal: verde ou vermelho diriam que o patrimônio subiu
 * ou desceu, e ele não mudou — o dinheiro só trocou de conta.
 *
 * Virou componente na Etapa 23, quando a mesma decisão passou a ser tomada em quatro
 * lugares — tabela e cartão, no painel e na lista de transações. Repetida, ela sairia do
 * lugar num deles sem ninguém perceber.
 */
export function ValorDaTransacao({
  tipo,
  valor,
  className = '',
}: {
  tipo: TipoTransacao
  valor: number
  className?: string
}) {
  const cor =
    tipo === 'TRANSFERENCIA'
      ? 'text-slate-600'
      : tipo === 'RECEITA'
        ? 'text-emerald-600'
        : 'text-red-600'

  const sinal = tipo === 'TRANSFERENCIA' ? '' : tipo === 'RECEITA' ? '+ ' : '- '

  return (
    <span className={`font-medium ${cor} ${className}`}>
      {sinal}
      {formatarMoeda(valor)}
    </span>
  )
}
