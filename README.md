# GeFinX — Frontend

Interface web do **GeFinX**, um gerenciador financeiro pessoal: o usuário cadastra receitas e
despesas classificadas por categoria e acompanha o saldo.

React 19 com Vite e Tailwind, consumindo a API REST que vive em repositório próprio,
`gefinx-backend`. Os dois são independentes de propósito — o objetivo de médio prazo do projeto é
extrair alguns contextos do back-end como serviços separados.

> Projeto pessoal, de estudo, sem uso comercial.

---

## Requisitos

| | Versão usada |
|---|---|
| Node | 24.14.1 |
| npm | 11.12.1 |

E o back-end no ar em `http://localhost:8080` — sem ele, só as telas públicas carregam.

---

## Como rodar

```bash
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173`, que é a **única origem** liberada no CORS do
back-end. Servir de outra porta exige alterar a configuração de lá.

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Checagem de tipos (`tsc -b`) e build de produção |
| `npm run preview` | Serve o build gerado |
| `npm run lint` | Oxlint |
| `npm run auditoria` | `npm audit --audit-level=high` |

> A URL da API está fixa em `src/api/clienteApi.ts`. Movê-la para uma variável de ambiente
> (`VITE_API_URL`) é item conhecido e ainda pendente.

---

## Stack

| Camada | Escolha |
|---|---|
| UI | React 19.2 |
| Build | Vite 8.2 |
| Linguagem | TypeScript 6.0 |
| Estilo | Tailwind CSS 4.3, via plugin `@tailwindcss/vite` |
| HTTP | axios 1.19 |
| Rotas | react-router-dom 7.18 |
| Lint | Oxlint |

Estilização é 100% Tailwind — não há CSS próprio além do `index.css` que importa o framework.

---

## Estrutura

```
src/
├── api/          # clienteApi (axios + interceptors), autenticacaoApi, categoriasApi,
│                 # transacoesApi, sessoesApi, erros
├── contextos/    # ContextoAutenticacao — sessão em localStorage
├── componentes/  # Layout, RotaProtegida, FormularioTransacao, FormularioCategoria, ErroDeCampo
├── paginas/      # Login, Registro, Painel, Transacoes, Categorias
└── tipos/        # contratos compartilhados com a API
```

### Rotas

| Rota | Acesso |
|---|---|
| `/login`, `/registro` | pública |
| `/` (painel), `/transacoes`, `/categorias` | protegida por `RotaProtegida` |

Qualquer caminho desconhecido redireciona para `/`.

---

## Como a autenticação funciona

O token JWT vem do back-end no login ou cadastro e é guardado em `localStorage`, junto com nome e
e-mail. Dois interceptors do axios, em `src/api/clienteApi.ts`, cuidam do resto:

- **Na requisição**: anexa `Authorization: Bearer <token>` quando há token guardado.
- **Na resposta**: ao ver um `401`, encerra a sessão e manda o usuário ao login com um aviso.
  As rotas `/auth/**` são excluídas dessa regra — ali um `401` significa senha errada, resposta
  esperada do formulário, e não sessão expirada.

O cabeçalho traz **"Sair de todos"**, que chama `DELETE /api/sessoes` e invalida todo token já
emitido para aquela conta, não só a cópia local.

> O token em `localStorage` é acessível a JavaScript e, portanto, exposto a XSS. A alternativa —
> cookie `httpOnly` — mudaria o desenho da autenticação e está registrada como decisão em aberto.

---

## Tratamento de erro

A API responde erro em formato uniforme, com uma `mensagem` geral e um mapa `erros` por campo:

```json
{ "momento": "...", "status": 400, "mensagem": "Dados inválidos",
  "erros": { "senha": "Esta senha é comum demais e seria adivinhada rápido; escolha outra" } }
```

`ErroDeFormulario`, em `src/api/erros.ts`, carrega os dois lados através da fronteira página →
formulário, e seu construtor estático aceita tanto a exceção crua do axios quanto um erro já
convertido — o que permite usá-lo dos dois lados sem que o chamador saiba em qual está.

Na tela, cada mensagem aparece **sob o campo que a provocou**, via `ErroDeCampo`. Quando há erro
de campo o aviso geral some: ele diria "Dados inválidos" logo acima da linha que já diz qual dado
e por quê. Erro sem campo — `409` de nome duplicado, `429` de limite excedido — continua no aviso
geral, que é onde ele cabe.

---

## Convenções

Componentes, funções, variáveis e rotas em **português**, acompanhando o back-end. As exceções são
os nomes que vêm das bibliotecas (`useState`, `NavLink`) e os scripts padrão do Vite.

---

## Limitações conhecidas

- **URL da API fixa** em `clienteApi.ts`, sem `VITE_API_URL`.
- **Sem testes automatizados.** O back-end tem 89; aqui, nenhum.
- **Sem paginação** na lista de transações — degrada conforme o histórico cresce.
- **Sem refresh token**: a sessão dura 24h e acaba, sem renovação silenciosa.
