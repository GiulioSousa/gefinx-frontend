# Changelog

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
