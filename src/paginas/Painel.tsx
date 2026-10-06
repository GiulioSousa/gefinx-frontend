import { useEffect, useState } from 'react'
import { buscarSaldo, criarTransacao, listarTransacoes } from '../api/transacoesApi'
import type { DadosTransacao } from '../api/transacoesApi'
import { listarCategorias } from '../api/categoriasApi'
import { listarContas } from '../api/contasApi'
import type { Categoria, Conta, Saldo, Transacao } from '../tipos'
import { ErroDeFormulario, extrairMensagemErro, foiCancelada } from '../api/erros'
import { BotaoFlutuante } from '../componentes/BotaoFlutuante'
import { FormularioTransacao } from '../componentes/FormularioTransacao'
import { Modal } from '../componentes/Modal'
import { SeletorDePeriodo } from '../componentes/SeletorDePeriodo'
import { ValorDaTransacao } from '../componentes/ValorDaTransacao'
import { intervaloDoPeriodo, mesAtual, type Periodo } from '../componentes/periodo'
import { VIDRO } from '../componentes/vidro'

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(data: string): string {
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR')
}

/** O que o período recorta, junto com as datas que o produziram. */
interface Movimentacao {
  dataInicio: string
  dataFim: string
  totais: Saldo
  recentes: Transacao[]
}

export function Painel() {
  const [saldo, setSaldo] = useState<Saldo | null>(null)
  const [contas, setContas] = useState<Conta[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [periodo, setPeriodo] = useState<Periodo>(mesAtual)
  const [movimentacao, setMovimentacao] = useState<Movimentacao | null>(null)
  const [erroDaMovimentacao, setErroDaMovimentacao] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  // Incrementar pede uma nova busca, porque os efeitos de carga dependem dele. É como o painel
  // se atualiza depois de um lançamento sem piscar o "Carregando...".
  const [recarga, setRecarga] = useState(0)

  const { dataInicio, dataFim } = intervaloDoPeriodo(periodo)

  // O que o período não alcança: o saldo e o saldo por conta são sempre o acumulado de toda a
  // história, e trocar de mês não os busca de novo.
  //
  // As categorias vêm junto só por causa do formulário de nova transação: são poucas linhas,
  // e buscá-las no toque do botão faria o formulário abrir com atraso ou, se a busca
  // falhasse, não abrir.
  useEffect(() => {
    async function carregar() {
      try {
        const [saldoObtido, contasObtidas, categoriasObtidas] = await Promise.all([
          buscarSaldo(),
          listarContas(),
          listarCategorias(),
        ])
        setSaldo(saldoObtido)
        setContas(contasObtidas)
        setCategorias(categoriasObtidas)
      } catch (excecao) {
        setErro(extrairMensagemErro(excecao, 'Não foi possível carregar o painel'))
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [recarga])

  // O que o período recorta. Cinco transações pedidas ao servidor, e não o período inteiro
  // baixado para descartar tudo menos as cinco primeiras.
  //
  // A busca anterior é abortada quando o período muda, pelo motivo que Transacoes.tsx
  // registra: com duas no ar, é a resposta mais lenta que pinta a tela, e quem clicasse
  // depressa nas setas veria os totais de um mês sob o nome de outro.
  useEffect(() => {
    const controlador = new AbortController()

    async function carregar() {
      try {
        const [totais, pagina] = await Promise.all([
          buscarSaldo({ dataInicio, dataFim }, controlador.signal),
          listarTransacoes(0, 5, { dataInicio, dataFim }, controlador.signal),
        ])
        setMovimentacao({ dataInicio, dataFim, totais, recentes: pagina.itens })
        setErroDaMovimentacao('')
      } catch (excecao) {
        if (foiCancelada(excecao)) {
          return
        }
        setErroDaMovimentacao(
          extrairMensagemErro(excecao, 'Não foi possível carregar a movimentação do período'),
        )
      }
    }

    carregar()
    return () => controlador.abort()
  }, [dataInicio, dataFim, recarga])

  function escolherPeriodo(novo: Periodo) {
    setPeriodo(novo)
    setErroDaMovimentacao('')
  }

  async function salvar(dados: DadosTransacao) {
    try {
      await criarTransacao(dados)
      setMostrarFormulario(false)
      // Recarrega o painel inteiro, e não só a lista: o lançamento novo muda os totais, o
      // saldo da conta e as últimas transações de uma vez.
      setRecarga((atual) => atual + 1)
    } catch (excecao) {
      // Ver Categorias.tsx: a conversão para Error descartava o mapa por campo.
      throw ErroDeFormulario.de(excecao, 'Não foi possível salvar a transação')
    }
  }

  if (erro) {
    return <p className="text-red-600 dark:text-red-400">{erro}</p>
  }

  if (carregando || (movimentacao === null && !erroDaMovimentacao)) {
    return <p className="text-slate-500 dark:text-slate-400">Carregando...</p>
  }

  // Os números na tela são de um período, e o seletor já mostra outro: continuam visíveis,
  // esmaecidos, até os novos chegarem. Sumir com eles faria a tela pular a cada seta.
  const atualizando =
    movimentacao !== null && (movimentacao.dataInicio !== dataInicio || movimentacao.dataFim !== dataFim)

  return (
    <div className="space-y-8">
      {/*
        O saldo é a história inteira, e por isso fica fora da seção do período: posto na grade
        de receitas e despesas, sob o seletor, pareceria mudar com o mês. Numa linha só, rótulo
        e valor, para que a movimentação comece o mais perto possível do topo no celular.
      */}
      <div className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg p-4 sm:p-5 ${VIDRO}`}>
        <p className="text-sm text-slate-500 dark:text-slate-400">Saldo</p>
        <p className={`text-2xl font-semibold ${(saldo?.saldo ?? 0) >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-600 dark:text-red-400'}`}>
          {formatarMoeda(saldo?.saldo ?? 0)}
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Saldo por conta</h2>
        {contas.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma conta cadastrada.</p>
        ) : (
          // Ver o comentário das receitas e despesas, abaixo, sobre o `text-lg` que faz o valor
          // caber em meia tela. O nome quebra linha em vez de ser cortado — a tabela antiga
          // deixava rolar até ele, e o cartão não rola.
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {contas.map((conta) => (
              <li key={conta.id} className={`rounded-lg p-3 sm:p-5 ${VIDRO}`}>
                <p className="text-sm wrap-break-word text-slate-600 dark:text-slate-300">{conta.nome}</p>
                <p
                  className={`mt-1 text-lg font-semibold sm:text-xl ${
                    conta.saldo >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatarMoeda(conta.saldo)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tudo o que o seletor alcança mora dentro desta seção, e nada que ele não alcance. */}
      <section aria-labelledby="titulo-movimentacao" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 id="titulo-movimentacao" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Movimentação
          </h2>
          <SeletorDePeriodo periodo={periodo} aoMudar={escolherPeriodo} />
        </div>

        {erroDaMovimentacao ? (
          <p className="text-sm text-red-600 dark:text-red-400">{erroDaMovimentacao}</p>
        ) : (
          movimentacao && (
            <div aria-busy={atualizando} className={`space-y-8 transition-opacity ${atualizando ? 'opacity-60' : ''}`}>
              {/*
                Abaixo de `sm` o valor cai para `text-lg` e o cartão para `p-3`, e isso não é
                estética. O formato pt-BR põe um espaço não-quebrável depois de "R$", então o
                valor é uma palavra só, que não quebra: em `text-2xl` numa coluna de meia tela
                ele vazava para fora do cartão em vez de se ajustar. Com o tamanho reduzido, os
                112px úteis de um aparelho de 320px comportam até "R$ 128.450,90"; num de 375px
                sobra folga para a casa dos milhões.
              */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className={`rounded-lg p-3 sm:p-5 ${VIDRO}`}>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Receitas</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400 sm:text-2xl">
                    {formatarMoeda(movimentacao.totais.totalReceitas)}
                  </p>
                </div>
                <div className={`rounded-lg p-3 sm:p-5 ${VIDRO}`}>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Despesas</p>
                  <p className="mt-1 text-lg font-semibold text-red-600 dark:text-red-400 sm:text-2xl">
                    {formatarMoeda(movimentacao.totais.totalDespesas)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">Últimas transações</h3>
                {movimentacao.recentes.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma transação neste período.</p>
                ) : (
                  <div className={`rounded-lg ${VIDRO}`}>
                    {/* Ver Transacoes.tsx: abaixo de `sm` a tabela era cortada sem possibilidade
                        de rolar, e o valor — o dado que se vem ao painel para ver — sumia. */}
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800 sm:hidden">
                      {movimentacao.recentes.map((transacao) => (
                        <li key={transacao.id} className="flex items-start justify-between gap-3 p-4">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900 dark:text-slate-100">{transacao.descricao}</p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              {transacao.nomeCategoria ??
                                (transacao.nomeContaDestino
                                  ? `${transacao.nomeConta} → ${transacao.nomeContaDestino}`
                                  : '—')}{' '}
                              · {formatarData(transacao.dataTransacao)}
                            </p>
                          </div>
                          <ValorDaTransacao
                            tipo={transacao.tipo}
                            valor={transacao.valor}
                            className="shrink-0"
                          />
                        </li>
                      ))}
                    </ul>

                    <table className="hidden w-full text-left text-sm sm:table">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="rounded-tl-lg px-4 py-2 font-medium">Descrição</th>
                          <th className="px-4 py-2 font-medium">Categoria</th>
                          <th className="px-4 py-2 font-medium">Data</th>
                          <th className="rounded-tr-lg px-4 py-2 text-right font-medium">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {movimentacao.recentes.map((transacao) => (
                          <tr key={transacao.id}>
                            <td className="px-4 py-2 text-slate-900 dark:text-slate-100">{transacao.descricao}</td>
                            <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                              {transacao.nomeCategoria ??
                                (transacao.nomeContaDestino
                                  ? `${transacao.nomeConta} → ${transacao.nomeContaDestino}`
                                  : '—')}
                            </td>
                            <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{formatarData(transacao.dataTransacao)}</td>
                            <td className="px-4 py-2 text-right">
                              <ValorDaTransacao tipo={transacao.tipo} valor={transacao.valor} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </section>

      {/* O botão continua na página com o modal aberto: é para ele que o foco volta quando
          a janela fecha, e não para o topo da página. */}
      <BotaoFlutuante rotulo="Nova transação" onClick={() => setMostrarFormulario(true)} />

      {mostrarFormulario && (
        <Modal titulo="Nova transação" aoFechar={() => setMostrarFormulario(false)} fecharAoTocarFora={false}>
          <FormularioTransacao
            categorias={categorias}
            contas={contas}
            aoSalvar={salvar}
            aoCancelar={() => setMostrarFormulario(false)}
          />
        </Modal>
      )}
    </div>
  )
}
