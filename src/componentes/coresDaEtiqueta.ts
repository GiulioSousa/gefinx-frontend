import type { CorDaEtiqueta } from '../tipos'

/*
  As dez cores, na ordem da escolha. Cada uma é um texto 700 no tema claro e 300 no escuro, como
  os selos de situação do Planejamento: o selo da etiqueta é texto e contorno na cor, sem fundo
  tingido, e o contraste é o do texto sobre o vidro do cartão. A bolinha usa a mesma cor
  (`bg-current`), para que o que se escolhe seja o que aparece.

  As classes vão escritas por inteiro, e não montadas a partir do nome da cor: o Tailwind só
  gera o que encontra escrito no código.

  Moram fora de `etiquetas.tsx` porque um arquivo de componentes que exporta outra coisa perde
  o recarregamento rápido do Vite.
*/
export const CORES_DA_ETIQUETA: { cor: CorDaEtiqueta; rotulo: string; classe: string }[] = [
  { cor: 'ROXO', rotulo: 'Roxo', classe: 'text-purple-700 dark:text-purple-300' },
  { cor: 'INDIGO', rotulo: 'Índigo', classe: 'text-indigo-700 dark:text-indigo-300' },
  { cor: 'AZUL', rotulo: 'Azul', classe: 'text-blue-700 dark:text-blue-300' },
  { cor: 'CIANO', rotulo: 'Ciano', classe: 'text-cyan-700 dark:text-cyan-300' },
  { cor: 'VERDE', rotulo: 'Verde', classe: 'text-green-700 dark:text-green-300' },
  { cor: 'AMBAR', rotulo: 'Âmbar', classe: 'text-amber-700 dark:text-amber-300' },
  { cor: 'LARANJA', rotulo: 'Laranja', classe: 'text-orange-700 dark:text-orange-300' },
  { cor: 'VERMELHO', rotulo: 'Vermelho', classe: 'text-red-700 dark:text-red-300' },
  { cor: 'ROSA', rotulo: 'Rosa', classe: 'text-pink-700 dark:text-pink-300' },
  { cor: 'CINZA', rotulo: 'Cinza', classe: 'text-slate-600 dark:text-slate-300' },
]

/** O mesmo limite do servidor (`DespesaPlanejada.MAXIMO_DE_ETIQUETAS`): o cartão e mais dois agrupamentos. */
export const MAXIMO_DE_ETIQUETAS = 3

export const CLASSE_DA_COR =Object.fromEntries(CORES_DA_ETIQUETA.map(({ cor, classe }) => [cor, classe])) as Record<
  CorDaEtiqueta,
  string
>

/**
 * Um chip de escolha entre etiquetas — no formulário e no filtro do plano. O marcado ganha a
 * borda verde, como as opções de "Aplicar a". Vai num `<label>` com a caixa de marcação
 * escondida dentro: as duas listas aceitam várias.
 */
export const CHIP =
  'flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 has-checked:border-emerald-600 has-checked:ring-1 has-checked:ring-emerald-600 has-focus-visible:outline-2 has-focus-visible:outline-emerald-500 dark:border-slate-700 dark:text-slate-300 dark:has-checked:border-emerald-400 dark:has-checked:ring-emerald-400'
