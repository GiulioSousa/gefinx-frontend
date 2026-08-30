import { useCallback, useEffect, useState } from 'react'
import type { Categoria, Conta, FiltroTransacoes, Transacao } from '../tipos'
import { listarCategorias } from '../api/categoriasApi'
import { listarContas } from '../api/contasApi'
import * as transacoesApi from '../api/transacoesApi'
import type { DadosTransacao } from '../api/transacoesApi'
import { FormularioTransacao } from '../componentes/FormularioTransacao'
import { ValorDaTransacao } from '../componentes/ValorDaTransacao'
import { ErroDeFormulario, extrairMensagemErro, foiCancelada } from '../api/erros'

/** O mesmo padrão da API. Cabe numa tela sem rolagem longa e sobra folga até o teto de 100. */
const TAMANHO_DA_PAGINA = 20

const ENTRADA = 'w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm dark:text-slate-100'

function formatarData(data: string): string {
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR')
}

export function Transacoes() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [contas, setContas] = useState<Conta[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [transacaoEmEdicao, setTransacaoEmEdicao] = useState<Transacao | undefined>(undefined)

  const [pagina, setPagina] = useState(0)
  const [filtro, setFiltro] = useState<FiltroTransacoes>({})
  const [totalItens, setTotalItens] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(0)

  /**
   * O `signal` não é detalhe: mudar dois filtros em seguida põe duas buscas no ar, e sem
   * cancelar a anterior é a resposta mais lenta que pinta a tela, não a mais recente. Isso
   * foi observado de verdade — a lista mostrava o recorte do filtro anterior enquanto a URL
   * pedida já era a certa, de modo que a tela discordava do que o usuário tinha acabado de
   * escolher, sem nenhum sinal de erro.
   */
  const carregarTransacoes = useCallback(async (signal?: AbortSignal) => {
    setCarregando(true)
    try {
      const resultado = await transacoesApi.listarTransacoes(
        pagina,
        TAMANHO_DA_PAGINA,
        filtro,
        signal,
      )
      setTransacoes(resultado.itens)
      setTotalItens(resultado.totalItens)
      setTotalPaginas(resultado.totalPaginas)

      // Excluir o último item de uma página deixaria a tela vazia com o histórico cheio,
      // parecendo que os lançamentos sumiram. Recuar uma página devolve o usuário ao lugar
      // onde ainda há o que ver.
      if (resultado.itens.length === 0 && pagina > 0) {
        setPagina(pagina - 1)
      }
    } catch (excecao) {
      // Cancelada é o caminho normal de quem trocou de filtro: quem a substituiu vai
      // desligar o "Carregando" quando chegar, e um aviso aqui seria erro inventado.
      if (foiCancelada(excecao)) {
        return
      }
      setErro(extrairMensagemErro(excecao, 'Não foi possível carregar as transações'))
    } finally {
      if (!signal?.aborted) {
        setCarregando(false)
      }
    }
  }, [pagina, filtro])

  /** Categorias e contas não mudam com a página nem com o filtro: são buscadas uma vez. */
  useEffect(() => {
    async function carregarReferencias() {
      try {
        const [categoriasObtidas, contasObtidas] = await Promise.all([
          listarCategorias(),
          listarContas(),
        ])
        setCategorias(categoriasObtidas)
        setContas(contasObtidas)
      } catch (excecao) {
        setErro(extrairMensagemErro(excecao, 'Não foi possível carregar categorias e contas'))
      }
    }
    carregarReferencias()
  }, [])

  // Recarrega quando a página ou o filtro mudam — que são exatamente as duas coisas que
  // alteram o recorte pedido ao servidor, e as mesmas que definem esta função. A limpeza
  // aborta a busca anterior, para que só a do recorte atual chegue à tela.
  useEffect(() => {
    const controlador = new AbortController()
    carregarTransacoes(controlador.signal)
    return () => controlador.abort()
  }, [carregarTransacoes])

  /**
   * Toda mudança de filtro volta para a primeira página. Sem isso, quem estivesse na página
   * 4 e filtrasse por um recorte de duas páginas cairia num vazio, e concluiria que o filtro
   * não encontrou nada.
   */
  function ajustarFiltro(mudanca: Partial<FiltroTransacoes>) {
    setFiltro((atual) => ({ ...atual, ...mudanca }))
    setPagina(0)
  }

  function limparFiltros() {
    setFiltro({})
    setPagina(0)
  }

  function abrirNovoFormulario() {
    setTransacaoEmEdicao(undefined)
    setMostrarFormulario(true)
  }

  function abrirEdicao(transacao: Transacao) {
    setTransacaoEmEdicao(transacao)
    setMostrarFormulario(true)
  }

  async function salvar(dados: DadosTransacao) {
    try {
      if (transacaoEmEdicao) {
        await transacoesApi.atualizarTransacao(transacaoEmEdicao.id, dados)
      } else {
        await transacoesApi.criarTransacao(dados)
      }
      setMostrarFormulario(false)
      setTransacaoEmEdicao(undefined)
      // O aviso descrevia uma falha anterior que o salvamento acabou de tornar passado.
      // Deixá-lo na tela faz a interface afirmar algo que já não é verdade.
      setErro('')
      await carregarTransacoes()
    } catch (excecao) {
      // Ver Categorias.tsx: a conversão para Error descartava o mapa por campo.
      throw ErroDeFormulario.de(excecao, 'Não foi possível salvar a transação')
    }
  }

  async function excluir(id: number) {
    if (!window.confirm('Excluir esta transação?')) {
      return
    }
    try {
      await transacoesApi.excluirTransacao(id)
      setErro('')
      await carregarTransacoes()
    } catch (excecao) {
      setErro(extrairMensagemErro(excecao, 'Não foi possível excluir a transação'))
    }
  }

  const temFiltro = Object.values(filtro).some((valor) => valor !== undefined && valor !== '')
  const primeiroDaPagina = totalItens === 0 ? 0 : pagina * TAMANHO_DA_PAGINA + 1
  const ultimoDaPagina = pagina * TAMANHO_DA_PAGINA + transacoes.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Transações</h1>
        {!mostrarFormulario && (
          <button
            onClick={abrirNovoFormulario}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Nova transação
          </button>
        )}
      </div>

      {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

      {mostrarFormulario && (
        <FormularioTransacao
          categorias={categorias}
          contas={contas}
          transacaoInicial={transacaoEmEdicao}
          aoSalvar={salvar}
          aoCancelar={() => {
            setMostrarFormulario(false)
            setTransacaoEmEdicao(undefined)
          }}
        />
      )}

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm text-slate-600 dark:text-slate-300">
            De
            <input
              type="date"
              value={filtro.dataInicio ?? ''}
              onChange={(evento) => ajustarFiltro({ dataInicio: evento.target.value || undefined })}
              className={ENTRADA}
            />
          </label>
          <label className="text-sm text-slate-600 dark:text-slate-300">
            Até
            <input
              type="date"
              value={filtro.dataFim ?? ''}
              onChange={(evento) => ajustarFiltro({ dataFim: evento.target.value || undefined })}
              className={ENTRADA}
            />
          </label>
          <label className="text-sm text-slate-600 dark:text-slate-300">
            Tipo
            <select
              value={filtro.tipo ?? ''}
              onChange={(evento) =>
                ajustarFiltro({ tipo: (evento.target.value || undefined) as FiltroTransacoes['tipo'] })
              }
              className={ENTRADA}
            >
              <option value="">Todos</option>
              <option value="RECEITA">Receita</option>
              <option value="DESPESA">Despesa</option>
              <option value="TRANSFERENCIA">Transferência</option>
            </select>
          </label>
          <label className="text-sm text-slate-600 dark:text-slate-300">
            Conta
            <select
              value={filtro.contaId ?? ''}
              onChange={(evento) =>
                ajustarFiltro({ contaId: evento.target.value ? Number(evento.target.value) : undefined })
              }
              className={ENTRADA}
            >
              <option value="">Todas</option>
              {contas.map((conta) => (
                <option key={conta.id} value={conta.id}>
                  {conta.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600 dark:text-slate-300">
            Categoria
            <select
              value={filtro.categoriaId ?? ''}
              onChange={(evento) =>
                ajustarFiltro({ categoriaId: evento.target.value ? Number(evento.target.value) : undefined })
              }
              className={ENTRADA}
            >
              <option value="">Todas</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        {temFiltro && (
          <button
            onClick={limparFiltros}
            className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {carregando ? (
        <p className="text-slate-500 dark:text-slate-400">Carregando...</p>
      ) : transacoes.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {temFiltro
            ? 'Nenhuma transação encontrada para esses filtros.'
            : 'Nenhuma transação cadastrada ainda.'}
        </p>
      ) : (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          {/*
            Cartões abaixo de `sm`, tabela a partir dali. Não é preferência estética: a
            tabela pede 606px e um celular de 375px oferece 343, então Data, Valor e Ações
            ficavam fora da área visível — e o `overflow-hidden` que arredondava os cantos
            impedia rolar até elas. O valor do lançamento, que é o dado principal aqui,
            simplesmente não aparecia, e não havia como editar nem excluir pelo celular.
          */}
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 sm:hidden">
            {transacoes.map((transacao) => (
              <li key={transacao.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{transacao.descricao}</p>
                  <ValorDaTransacao
                    tipo={transacao.tipo}
                    valor={transacao.valor}
                    className="shrink-0 text-right"
                  />
                </div>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {transacao.nomeCategoria ?? '—'} ·{' '}
                  {transacao.nomeContaDestino
                    ? `${transacao.nomeConta} → ${transacao.nomeContaDestino}`
                    : transacao.nomeConta}
                </p>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{formatarData(transacao.dataTransacao)}</span>
                  <span>
                    <button
                      onClick={() => abrirEdicao(transacao)}
                      className="mr-4 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => excluir(transacao.id)}
                      className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
                    >
                      Excluir
                    </button>
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <table className="hidden w-full text-left text-sm sm:table">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="rounded-tl-lg px-4 py-2 font-medium">Descrição</th>
                <th className="px-4 py-2 font-medium">Categoria</th>
                <th className="px-4 py-2 font-medium">Conta</th>
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2 text-right font-medium">Valor</th>
                <th className="rounded-tr-lg px-4 py-2 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transacoes.map((transacao) => (
                <tr key={transacao.id}>
                  <td className="px-4 py-2 text-slate-900 dark:text-slate-100">{transacao.descricao}</td>
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{transacao.nomeCategoria ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                    {transacao.nomeContaDestino
                      ? `${transacao.nomeConta} → ${transacao.nomeContaDestino}`
                      : transacao.nomeConta}
                  </td>
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{formatarData(transacao.dataTransacao)}</td>
                  <td className="px-4 py-2 text-right">
                    <ValorDaTransacao tipo={transacao.tipo} valor={transacao.valor} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => abrirEdicao(transacao)}
                      className="mr-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => excluir(transacao.id)}
                      className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {primeiroDaPagina}–{ultimoDaPagina} de {totalItens}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPagina(pagina - 1)}
                disabled={pagina === 0}
                className="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {pagina + 1} de {totalPaginas}
              </span>
              <button
                onClick={() => setPagina(pagina + 1)}
                disabled={pagina + 1 >= totalPaginas}
                className="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
