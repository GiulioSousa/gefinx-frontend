/*
  O vidro líquido da interface — a barra de abas do celular e todos os cartões —, em camadas de
  fora para dentro: a sombra difusa que o descola da página; a borda clara e os dois brilhos
  internos, no alto e embaixo, que desenham a espessura do vidro; o desfoque com saturação do
  que passa por trás; e o reflexo em gradiente na metade de cima, no `before:`.

  É só o material. Forma e espaçamento ficam com quem usa, e o reflexo herda o arredondamento
  de quem o carrega, para servir tanto à pílula da barra quanto ao cartão. O `isolate` faz de
  cada peça de vidro um contexto de empilhamento próprio, e é isso que deixa o `-z-10` pôr o
  reflexo entre o fundo e o conteúdo: sem ele, o gradiente branco pintaria por cima do texto.

  Quem pede ao sistema menos transparência recebe o fundo quase opaco — é para quem o texto
  disputando contraste com o que passa por baixo é um problema de leitura.
*/
export const VIDRO = [
  'relative isolate',
  'border border-white/70 dark:border-white/15',
  'bg-white/55 dark:bg-slate-900/10 backdrop-blur-sm backdrop-saturate-200',
  'shadow-[0_12px_32px_-12px_rgb(15_23_43/0.35),inset_0_1px_1px_rgb(255_255_255/0.9),inset_0_-1px_1px_rgb(255_255_255/0.3)]',
  'dark:shadow-[0_12px_32px_-12px_rgb(0_0_0/0.7),inset_0_1px_1px_rgb(255_255_255/0.15),inset_0_-1px_1px_rgb(255_255_255/0.05)]',
  'before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-linear-to-b before:from-white/60 before:to-transparent before:to-50% dark:before:from-white/10',
  '[@media(prefers-reduced-transparency:reduce)]:bg-white/95 dark:[@media(prefers-reduced-transparency:reduce)]:bg-slate-900/10',
].join(' ')
