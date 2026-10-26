import { useEffect, useState } from 'react'
import { useConfirmacao, useEscolha } from '../contextos/ContextoConfirmacao'
import type { Categoria, Conta, ContaDoPlanejamento, ItemDoPlanejamento, Planejamento as Plano, Recorrencia, SituacaoDaDespesa } from '../tipos'
import * as planejamentoApi from '../api/planejamentoApi'
import type { DadosDespesaPlanejada, DadosPagamento } from '../api/planejamentoApi'
import { listarCategorias } from '../api/categoriasApi'
import { listarContas } from '../api/contasApi'
import { ErroDeFormulario, extrairMensagemErro } from '../api/erros'
import { BotaoFlutuante } from '../componentes/BotaoFlutuante'
import { CalendarioDoPlanejamento } from '../componentes/CalendarioDoPlanejamento'
import { EscolhaDeContasDoPlanejamento } from '../componentes/EscolhaDeContasDoPlanejamento'
import { FormularioDespesaPlanejada } from '../componentes/FormularioDespesaPlanejada'
import { FormularioPagamento } from '../componentes/FormularioPagamento'
import { HistoricoDePagas } from '../componentes/HistoricoDePagas'
import { MenuFlutuante, OpcaoDoMenu } from '../componentes/MenuFlutuante'
import { Modal } from '../componentes/Modal'
import { LINHA_TOCAVEL, VIDRO } from '../componentes/vidro'

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Com o dia da semana: quem trabalha de segunda a sábado conta o prazo por ele. */
function formatarPrazo(data: string): string {
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

function porcentagem(parte: number, todo: number): number {
  if (todo <= 0) {
    return 0
  }
  return Math.min(100, Math.max(0, (parte / todo) * 100))
}

/*
  A situação vai por escrito, e não só pela cor: quem não distingue verde de vermelho lê o
  nome. As cores são as que já carregam esse sentido na paleta — verde para o que está bem,
  vermelho para o que falhou, âmbar para o aviso que não é erro. Sem fundo tingido, para o
  contraste ser o do texto sobre o cartão, que a PALETA.md já mediu.

  Laranja para "Vence hoje", entre o âmbar do aviso e o vermelho do que falhou, que é onde ela
  está: ainda dá tempo, mas só hoje. É o único tom da tela que não vem da paleta antiga, e a
  PALETA.md traz a medida de contraste dos dois temas.

  Em andamento não tem selo: é o caso comum, e um selo em todo cartão deixaria de chamar
  atenção para os outros.
*/
const SELO: Record<SituacaoDaDespesa, { rotulo: string; classe: string } | null> = {
  VENCE_HOJE: { rotulo: 'Vence hoje', classe: 'text-orange-700 dark:text-orange-400' },
  COBERTA: { rotulo: 'Coberta', classe: 'text-emerald-700 dark:text-emerald-400' },
  EM_ANDAMENTO: null,
  SEM_DIAS_DE_TRABALHO: { rotulo: 'Sem dias de trabalho', classe: 'text-amber-700 dark:text-amber-300' },
  ATRASADA: { rotulo: 'Atrasada', classe: 'text-red-600 dark:text-red-400' },
}

/** Ao lado do prazo, em texto e não em selo: os selos ficam para a situação da despesa. */
const REPETICAO: Record<Recorrencia, string> = {
  SEMANAL: 'toda semana',
  MENSAL: 'todo mês',
}

function Barra({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div
      role="progressbar"
      aria-label={rotulo}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(valor)}
      className="h-2 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10"
    >
      <div className="h-full rounded-full bg-emerald-600 transition-[width]" style={{ width: `${valor}%` }} />
    </div>
  )
}

/** O que falta, ou por que não há o que calcular. */
function DetalheDoItem({ item, pendente }: { item: ItemDoPlanejamento; pendente: number }) {
  if (item.situacao === 'COBERTA') {
    return <>O saldo de agora já paga esta despesa.</>
  }
  // A falta é do acumulado: passa do valor quando as despesas anteriores também não estão
  // cobertas, e sem o aviso pareceria um erro de conta.
  const contandoAnteriores = item.falta > item.valor ? ', contando as que vencem antes' : ''
  const falta = `Faltam ${formatarMoeda(item.falta)}${contandoAnteriores}.`

  if (item.situacao === 'ATRASADA') {
    // Atrasada vale mesmo com o saldo cobrindo: ter o dinheiro não paga a conta.
    return item.falta > 0 ? (
      <>{falta} O prazo já passou, e o que falta fica na meta até ela ser paga.</>
    ) : (
      <>O saldo cobre, mas o prazo já passou: falta pagar.</>
    )
  }
  if (item.situacao === 'VENCE_HOJE') {
    // Pelo mesmo motivo da atrasada, o selo vem antes de "coberta" — e aqui o texto diz o que
    // o selo não cabe dizer: se o dinheiro está lá, só falta pagar.
    return item.falta > 0 ? (
      <>{falta} O prazo é hoje, e o que falta entra inteiro na meta.</>
    ) : (
      <>O saldo cobre, e o prazo é hoje: falta pagar.</>
    )
  }
  if (item.situacao === 'SEM_DIAS_DE_TRABALHO') {
    return <>{falta} Não sobra dia de trabalho antes do prazo, e o que falta entra inteiro na meta.</>
  }
  // O por dia já desconta o pendente, que a meta pede à parte: sem o aviso, a falta dividida
  // pelos dias não daria a conta.
  const depoisDoPendente = pendente > 0 ? ', fora o pendente' : ''
  return (
    <>
      {falta} {formatarMoeda(item.porDia ?? 0)} por dia{depoisDoPendente}, em {item.diasDeTrabalho}{' '}
      {item.diasDeTrabalho === 1 ? 'dia de trabalho' : 'dias de trabalho'}.
    </>
  )
}

export function Planejamento() {
  const [plano, setPlano] = useState<Plano | null>(null)
  const [contas, setContas] = useState<ContaDoPlanejamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const confirmar = useConfirmacao()
  const escolher = useEscolha()
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [despesaEmEdicao, setDespesaEmEdicao] = useState<ItemDoPlanejamento | undefined>(undefined)
  const [mostrarContas, setMostrarContas] = useState(false)
  const [mostrarCalendario, setMostrarCalendario] = useState(false)
  const [menu, setMenu] = useState<{ item: ItemDoPlanejamento; ancora: HTMLElement } | null>(null)
  // A despesa sendo paga, com as categorias e contas que o formulário oferece. Buscadas só
  // ao abrir: a tela de planejamento não precisa delas para nada mais.
  const [pagamento, setPagamento] = useState<{ item: ItemDoPlanejamento; categorias: Categoria[]; contas: Conta[] } | null>(null)
  // Incrementar pede uma nova busca, como no Painel: a tela se atualiza depois de salvar sem
  // voltar ao "Carregando...".
  const [recarga, setRecarga] = useState(0)

  // O plano depende do saldo, das despesas e das contas marcadas: qualquer mudança em uma
  // delas o recalcula inteiro no servidor, e a tela só busca de novo.
  useEffect(() => {
    async function carregar() {
      try {
        const [planoObtido, contasObtidas] = await Promise.all([
          planejamentoApi.buscarPlanejamento(),
          planejamentoApi.listarContasDoPlanejamento(),
        ])
        setPlano(planoObtido)
        setContas(contasObtidas)
      } catch (excecao) {
        setErro(extrairMensagemErro(excecao, 'Não foi possível carregar o planejamento'))
      } finally {
        setCarregando(false)
      }
    }

    carregar()
  }, [recarga])

  function recarregar() {
    setRecarga((atual) => atual + 1)
  }

  function abrirNovoFormulario() {
    setDespesaEmEdicao(undefined)
    setMostrarFormulario(true)
  }

  function fecharFormulario() {
    setMostrarFormulario(false)
    setDespesaEmEdicao(undefined)
  }

  function alternarMenu(item: ItemDoPlanejamento, ancora: HTMLElement) {
    setMenu((atual) => (atual?.item.id === item.id ? null : { item, ancora }))
  }

  async function salvar(dados: DadosDespesaPlanejada, serie: boolean) {
    setErro('')
    try {
      if (despesaEmEdicao) {
        await planejamentoApi.atualizarDespesaPlanejada(despesaEmEdicao.id, dados, serie)
      } else {
        await planejamentoApi.criarDespesaPlanejada(dados)
      }
      fecharFormulario()
      recarregar()
    } catch (excecao) {
      throw ErroDeFormulario.de(excecao, 'Não foi possível salvar a despesa')
    }
  }

  async function excluir(item: ItemDoPlanejamento) {
    const mensagem = `Excluir "${item.descricao}" do planejamento?`
    let serie = false
    if (item.recorrencia) {
      // A que menos apaga vem marcada: só esta, e a série segue.
      const escolha = await escolher({
        titulo: 'Excluir despesa',
        mensagem: `${mensagem} Ela se repete ${REPETICAO[item.recorrencia]}${item.totalDeParcelas !== null ? `, e esta é a parcela ${item.parcela} de ${item.totalDeParcelas}` : ''}.`,
        confirmar: 'Excluir',
        perigosa: true,
        opcoes: [
          {
            valor: 'ESTA',
            rotulo: 'Somente esta ocorrência',
            descricao: 'A série continua: as outras ocorrências seguem no plano.',
          },
          {
            valor: 'SERIE',
            rotulo: 'Todas as ocorrências pendentes',
            descricao: 'A série acaba. As já pagas continuam no histórico.',
          },
        ],
      })
      if (escolha === null) {
        return
      }
      serie = escolha === 'SERIE'
    } else if (!(await confirmar({ titulo: 'Excluir despesa', mensagem, confirmar: 'Excluir', perigosa: true }))) {
      return
    }
    setErro('')
    try {
      await planejamentoApi.excluirDespesaPlanejada(item.id, serie)
      recarregar()
    } catch (excecao) {
      setErro(extrairMensagemErro(excecao, 'Não foi possível excluir a despesa'))
    }
  }

  async function abrirPagamento(item: ItemDoPlanejamento) {
    setErro('')
    try {
      const [categorias, contasObtidas] = await Promise.all([listarCategorias(), listarContas()])
      setPagamento({ item, categorias, contas: contasObtidas })
    } catch (excecao) {
      setErro(extrairMensagemErro(excecao, 'Não foi possível abrir o pagamento'))
    }
  }

  async function pagar(dados: DadosPagamento) {
    if (!pagamento) {
      return
    }
    try {
      await planejamentoApi.pagarDespesaPlanejada(pagamento.item.id, dados)
      setPagamento(null)
      recarregar()
    } catch (excecao) {
      throw ErroDeFormulario.de(excecao, 'Não foi possível registrar o pagamento')
    }
  }

  async function salvarContas(contasDeFora: number[]) {
    await planejamentoApi.definirContasDeFora(contasDeFora)
    setMostrarContas(false)
    recarregar()
  }

  if (carregando) {
    return <p className="text-slate-500 dark:text-slate-400">Carregando...</p>
  }

  const contasDeFora = contas.filter((conta) => !conta.entraNoPlanejamento)

  return (
    <div className="space-y-6">
      {/* Quebra a linha em tela estreita: título e dois botões com texto não cabem em 360 px. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Planejamento</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMostrarCalendario(true)}
            disabled={!plano}
            className="flex items-center gap-2 rounded-md p-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Calendário
          </button>
          <button
            type="button"
            onClick={() => setMostrarContas(true)}
            className="flex items-center gap-2 rounded-md p-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            Contas
          </button>
        </div>
      </div>

      {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

      {plano && (
        <>
          <CartaoDaMeta plano={plano} />

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Saldo considerado:{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">{formatarMoeda(plano.saldoAtual)}</span>
            {contasDeFora.length > 0 && <> — sem {contasDeFora.map((conta) => conta.nome).join(', ')}</>}
          </p>

          <section aria-labelledby="titulo-despesas" className="space-y-3">
            <h2 id="titulo-despesas" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Despesas planejadas
            </h2>

            {plano.itens.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nenhuma despesa planejada. Adicione uma com o valor e o prazo de pagamento, e o planejamento diz quanto
                falta e quanto ganhar por dia até lá.
              </p>
            ) : (
              <ul className="space-y-3">
                {plano.itens.map((item) => {
                  const selo = SELO[item.situacao]
                  const coberto = item.valor - Math.min(item.valor, item.falta)
                  return (
                    <li key={item.id} className={`overflow-hidden rounded-lg ${VIDRO}`}>
                      {/* O cartão inteiro é o botão que abre Editar e Excluir, como em Transações. */}
                      <button
                        type="button"
                        onClick={(evento) => alternarMenu(item, evento.currentTarget)}
                        aria-haspopup="true"
                        aria-expanded={menu?.item.id === item.id}
                        className={`${LINHA_TOCAVEL} block w-full space-y-2 p-4 text-left`}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="font-medium text-slate-900 dark:text-slate-100">{item.descricao}</span>
                          <span className="shrink-0 font-semibold text-slate-900 dark:text-slate-100">
                            {formatarMoeda(item.valor)}
                          </span>
                        </span>

                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                          até {formatarPrazo(item.prazo)}
                          {item.recorrencia && <span>· {REPETICAO[item.recorrencia]}</span>}
                          {item.totalDeParcelas !== null && (
                            <span>
                              · parcela {item.parcela} de {item.totalDeParcelas}
                            </span>
                          )}
                          {selo && (
                            <span className={`rounded-full border border-current px-2 text-xs font-medium ${selo.classe}`}>
                              {selo.rotulo}
                            </span>
                          )}
                        </span>

                        <Barra
                          valor={porcentagem(coberto, item.valor)}
                          rotulo={`${item.descricao}: ${formatarMoeda(coberto)} de ${formatarMoeda(item.valor)} cobertos pelo saldo`}
                        />

                        <span className="block text-sm text-slate-600 dark:text-slate-300">
                          <DetalheDoItem item={item} pendente={plano.pendente} />
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <HistoricoDePagas versao={recarga} hoje={plano.hoje} aoDesfazer={recarregar} />
        </>
      )}

      <BotaoFlutuante rotulo="Nova despesa" onClick={abrirNovoFormulario} />

      {menu && (
        <MenuFlutuante rotulo={`Ações da despesa ${menu.item.descricao}`} ancora={menu.ancora} aoFechar={() => setMenu(null)}>
          <OpcaoDoMenu
            aoEscolher={() => {
              setMenu(null)
              abrirPagamento(menu.item)
            }}
          >
            Marcar como paga
          </OpcaoDoMenu>
          <OpcaoDoMenu
            aoEscolher={() => {
              setMenu(null)
              setDespesaEmEdicao(menu.item)
              setMostrarFormulario(true)
            }}
          >
            Editar
          </OpcaoDoMenu>
          <OpcaoDoMenu
            perigosa
            aoEscolher={() => {
              setMenu(null)
              excluir(menu.item)
            }}
          >
            Excluir
          </OpcaoDoMenu>
        </MenuFlutuante>
      )}

      {mostrarFormulario && (
        <Modal
          titulo={despesaEmEdicao ? 'Editar despesa planejada' : 'Nova despesa planejada'}
          aoFechar={fecharFormulario}
          fecharAoTocarFora={false}
        >
          <FormularioDespesaPlanejada despesaInicial={despesaEmEdicao} aoSalvar={salvar} aoCancelar={fecharFormulario} />
        </Modal>
      )}

      {pagamento && plano && (
        <Modal titulo="Pagar despesa" aoFechar={() => setPagamento(null)} fecharAoTocarFora={false}>
          <FormularioPagamento
            despesa={pagamento.item}
            hoje={plano.hoje}
            categorias={pagamento.categorias}
            contas={pagamento.contas}
            aoSalvar={pagar}
            aoCancelar={() => setPagamento(null)}
          />
        </Modal>
      )}

      {/* Sem fechar ao tocar fora: o formulário de período pode estar pela metade. */}
      {mostrarCalendario && plano && (
        <Modal titulo="Calendário de trabalho" aoFechar={() => setMostrarCalendario(false)} fecharAoTocarFora={false}>
          <CalendarioDoPlanejamento
            hoje={plano.hoje}
            aoMudar={recarregar}
            aoFechar={() => setMostrarCalendario(false)}
          />
        </Modal>
      )}

      {mostrarContas && (
        <Modal titulo="Contas no planejamento" aoFechar={() => setMostrarContas(false)}>
          <EscolhaDeContasDoPlanejamento
            contas={contas}
            aoSalvar={salvarContas}
            aoCancelar={() => setMostrarContas(false)}
          />
        </Modal>
      )}
    </div>
  )
}

/**
 * A meta diária e o quanto dela já veio hoje. A meta fica parada durante o dia — sai do
 * saldo do fim de ontem —, e o que se ganha hoje enche a barra em vez de mudar o número.
 */
function CartaoDaMeta({ plano }: { plano: Plano }) {
  const temMeta = plano.metaDiaria > 0

  if (!temMeta) {
    if (plano.itens.length === 0) {
      return null
    }
    const algoDescoberto = plano.itens.some((item) => item.falta > 0)
    return (
      <div className={`rounded-lg p-4 sm:p-5 ${VIDRO}`}>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {/* Sem meta e com algo descoberto, o saldo de ontem cobria tudo: a falta veio do dia de hoje. */}
          {algoDescoberto
            ? 'O saldo de ontem cobria as despesas, mas o de agora não cobre mais: veja as despesas abaixo.'
            : 'O saldo de agora cobre todas as despesas planejadas.'}
        </p>
      </div>
    )
  }

  const cumprida = plano.restanteHoje <= 0
  const ganhoVisivel = Math.max(0, plano.ganhoDeHoje)
  // Na folga — domingo, feriado, período sem trabalho — hoje não entra na conta da meta, e uma
  // barra de "hoje" pediria um ganho que o plano não espera: o cartão diz o motivo no lugar.
  // Quem decide é o servidor, que conhece o calendário de quem usa.
  const folga = plano.folgaDeHoje

  return (
    <div className={`space-y-3 rounded-lg p-4 sm:p-5 ${VIDRO}`}>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Ganhar por dia</p>
        <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatarMoeda(plano.metaDiaria)}</p>
        {plano.pendente > 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {formatarMoeda(plano.pendente)} pendentes, que ficam na meta até serem pagos
            {plano.prazoDecisivo && (
              <>
                , mais {formatarMoeda(plano.metaDiaria - plano.pendente)} nos dias de trabalho, até{' '}
                {formatarPrazo(plano.prazoDecisivo)}
              </>
            )}
          </p>
        ) : (
          plano.prazoDecisivo && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              nos dias de trabalho, até {formatarPrazo(plano.prazoDecisivo)}
            </p>
          )
        )}
      </div>

      {folga ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Hoje não conta: <span className="font-medium">{folga}</span>. A meta vale para os próximos dias de trabalho.
        </p>
      ) : (
        <>
          <Barra
            valor={porcentagem(ganhoVisivel, plano.metaDiaria)}
            rotulo={`Hoje: ${formatarMoeda(ganhoVisivel)} de ${formatarMoeda(plano.metaDiaria)}`}
          />

          <p className="text-sm text-slate-600 dark:text-slate-300">
            Hoje: {formatarMoeda(plano.ganhoDeHoje)} de {formatarMoeda(plano.metaDiaria)}
            {' — '}
            {cumprida ? (
              <span className="font-medium text-emerald-700 dark:text-emerald-400">meta de hoje cumprida</span>
            ) : (
              <>faltam {formatarMoeda(plano.restanteHoje)}</>
            )}
          </p>
        </>
      )}
    </div>
  )
}
