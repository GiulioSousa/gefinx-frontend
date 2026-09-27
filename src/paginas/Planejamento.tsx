import { useEffect, useState } from 'react'
import type { Categoria, Conta, ContaDoPlanejamento, ItemDoPlanejamento, Planejamento as Plano, SituacaoDaDespesa } from '../tipos'
import * as planejamentoApi from '../api/planejamentoApi'
import type { DadosDespesaPlanejada, DadosPagamento } from '../api/planejamentoApi'
import { listarCategorias } from '../api/categoriasApi'
import { listarContas } from '../api/contasApi'
import { ErroDeFormulario, extrairMensagemErro } from '../api/erros'
import { BotaoFlutuante } from '../componentes/BotaoFlutuante'
import { EscolhaDeContasDoPlanejamento } from '../componentes/EscolhaDeContasDoPlanejamento'
import { FormularioDespesaPlanejada } from '../componentes/FormularioDespesaPlanejada'
import { FormularioPagamento } from '../componentes/FormularioPagamento'
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

  Em andamento não tem selo: é o caso comum, e um selo em todo cartão deixaria de chamar
  atenção para os outros.
*/
const SELO: Record<SituacaoDaDespesa, { rotulo: string; classe: string } | null> = {
  COBERTA: { rotulo: 'Coberta', classe: 'text-emerald-700 dark:text-emerald-400' },
  EM_ANDAMENTO: null,
  SEM_DIAS_DE_TRABALHO: { rotulo: 'Sem dias de trabalho', classe: 'text-amber-700 dark:text-amber-300' },
  ATRASADA: { rotulo: 'Atrasada', classe: 'text-red-600 dark:text-red-400' },
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
function DetalheDoItem({ item }: { item: ItemDoPlanejamento }) {
  if (item.situacao === 'COBERTA') {
    return <>O saldo de agora já paga esta despesa.</>
  }
  // A falta é do acumulado: passa do valor quando as despesas anteriores também não estão
  // cobertas, e sem o aviso pareceria um erro de conta.
  const contandoAnteriores = item.falta > item.valor ? ', contando as que vencem antes' : ''
  const falta = `Faltam ${formatarMoeda(item.falta)}${contandoAnteriores}.`

  if (item.situacao === 'ATRASADA') {
    // Atrasada vale mesmo com o saldo cobrindo: ter o dinheiro não paga a conta.
    return item.falta > 0 ? <>{falta} O prazo já passou.</> : <>O saldo cobre, mas o prazo já passou: falta pagar.</>
  }
  if (item.situacao === 'SEM_DIAS_DE_TRABALHO') {
    return <>{falta} Não sobra dia de trabalho antes do prazo.</>
  }
  return (
    <>
      {falta} {formatarMoeda(item.porDia ?? 0)} por dia, em {item.diasDeTrabalho}{' '}
      {item.diasDeTrabalho === 1 ? 'dia de trabalho' : 'dias de trabalho'}.
    </>
  )
}

export function Planejamento() {
  const [plano, setPlano] = useState<Plano | null>(null)
  const [contas, setContas] = useState<ContaDoPlanejamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [despesaEmEdicao, setDespesaEmEdicao] = useState<ItemDoPlanejamento | undefined>(undefined)
  const [mostrarContas, setMostrarContas] = useState(false)
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

  async function salvar(dados: DadosDespesaPlanejada) {
    setErro('')
    try {
      if (despesaEmEdicao) {
        await planejamentoApi.atualizarDespesaPlanejada(despesaEmEdicao.id, dados)
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
    if (!window.confirm(`Excluir "${item.descricao}" do planejamento?`)) {
      return
    }
    setErro('')
    try {
      await planejamentoApi.excluirDespesaPlanejada(item.id)
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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Planejamento</h1>
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
                          <DetalheDoItem item={item} />
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
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
          {algoDescoberto
            ? 'Não há dia de trabalho até os prazos que faltam cobrir: veja as despesas abaixo.'
            : 'O saldo de agora cobre todas as despesas planejadas.'}
        </p>
      </div>
    )
  }

  const cumprida = plano.restanteHoje <= 0
  const ganhoVisivel = Math.max(0, plano.ganhoDeHoje)
  // Domingo não entra na conta da meta, e uma barra de "hoje" pediria um ganho que o plano
  // não espera. O dia vem do servidor, que decide pelo fuso configurado.
  const domingo = new Date(`${plano.hoje}T00:00:00`).getDay() === 0

  return (
    <div className={`space-y-3 rounded-lg p-4 sm:p-5 ${VIDRO}`}>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Ganhar por dia</p>
        <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatarMoeda(plano.metaDiaria)}</p>
        {plano.prazoDecisivo && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            de segunda a sábado, até {formatarPrazo(plano.prazoDecisivo)}
          </p>
        )}
      </div>

      {domingo ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Domingo não conta como dia de trabalho. O que entrar hoje reduz a meta de amanhã.
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
