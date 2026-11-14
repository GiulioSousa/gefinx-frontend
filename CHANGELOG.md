# Changelog

## [0.3.0](https://github.com/GiulioSousa/gefinx-frontend/compare/v0.2.0...v0.3.0) (2026-11-14)


### Funcionalidades

* **planejamento:** permite marcar ate tres etiquetas e filtrar por varias ([50ab2b7](https://github.com/GiulioSousa/gefinx-frontend/commit/50ab2b7061d5c3af4ca503b793edd9ba61c77e9a))

## [0.2.0](https://github.com/GiulioSousa/gefinx-frontend/compare/v0.1.0...v0.2.0) (2026-11-09)

Custo diário na meta, e uma meta que acompanha cada lançamento. O cartão da meta passa a mostrar só
a meta do dia e as receitas de hoje, sem barra de progresso; a barra fica só nas despesas
planejadas. Um cartão novo, Custo diário, mostra a média de cada categoria escolhida nos últimos 30
dias, pelos dias em que houve gasto nela, e abre a escolha das categorias. Requer o backend 0.2.0.

### Funcionalidades

* **api:** reconhece o custo diario e as receitas de hoje no planejamento ([659dc7e](https://github.com/GiulioSousa/gefinx-frontend/commit/659dc7edaebad1dce9d33d73f56ca0b68fa84713))
* **planejamento:** mostra a media de cada categoria do custo diario ([19bc6e3](https://github.com/GiulioSousa/gefinx-frontend/commit/19bc6e30cac1d3d531c78c7cc0f2c145feafaabc))
* **planejamento:** mostra o custo diario e so a meta e as receitas no cartao ([bfcdb73](https://github.com/GiulioSousa/gefinx-frontend/commit/bfcdb73b5508a108d6fd54c2814aa3810b839754))

## [0.1.0](https://github.com/GiulioSousa/gefinx-frontend/releases/tag/v0.1.0) (2026-11-09)

Primeira versão marcada do GeFinX. Reúne a interface construída até aqui em React 19 com Vite e
Tailwind: painel, transações, contas, planejamento e relatórios, com tema claro e escuro e
navegação adaptada ao celular.

### Funcionalidades

* **auth:** login por usuário e senha, troca de senha, saída de todos os dispositivos e aviso quando a sessão expira
* **painel:** saldo em destaque, contas em cartões, movimentação por mês ou pelos últimos dias e lançamento direto
* **transacoes:** formulário em modal com máscara de valor, transferência entre contas, filtros, paginação e seletor de período
* **contas:** saldo por conta, com renomear e excluir num menu ancorado
* **categorias:** cadastro com editar e excluir num menu ancorado
* **planejamento:** meta diária, pagamento pelo cartão, histórico com desfazer, recorrência, parcelamento, etiquetas e selo "vence hoje"
* **relatorios:** receitas, despesas e categorias mês a mês
* **layout:** tema claro e escuro, vidro líquido nos cartões, barra de abas no celular e confirmações em modal próprio
