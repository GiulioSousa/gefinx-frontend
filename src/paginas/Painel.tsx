import { useEffect, useState } from 'react'
import { buscarSaldo, listarTransacoes } from '../api/transacoesApi'
import { listarContas } from '../api/contasApi'
import type { Conta, Saldo, Transacao } from '../tipos'
import { extrairMensagemErro } from '../api/erros'
import { ValorDaTransacao } from '../componentes/ValorDaTransacao'

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(data: string): string {
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR')
}

export function Painel() {
  const [saldo, setSaldo] = useState<Saldo | null>(null)
  const [transacoesRecentes, setTransacoesRecentes] = useState<Transacao[]>([])
  const [contas, setContas] = useState<Conta[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregar() {
      try {
        // Cinco linhas pedidas ao servidor, e não o histórico inteiro baixado para
        // descartar tudo menos as cinco primeiras — que era o custo mais caro da tela,
        // crescendo a cada lançamento novo.
        const [saldoObtido, transacoes, contasObtidas] = await Promise.all([
          buscarSaldo(),
          listarTransacoes(0, 5),
          listarContas(),
        ])
        setSaldo(saldoObtido)
        setTransacoesRecentes(transacoes.itens)
        setContas(contasObtidas)
      } catch (excecao) {
        setErro(extrairMensagemErro(excecao, 'Não foi possível carregar o painel'))
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  if (carregando) {
    return <p className="text-slate-500 dark:text-slate-400">Carregando...</p>
  }

  if (erro) {
    return <p className="text-red-600 dark:text-red-400">{erro}</p>
  }

  return (
    <div className="space-y-8">
      {/*
        Dois cartões por linha no celular, em vez de um empilhado sob o outro. O saldo ocupa a
        linha inteira: com três cartões em duas colunas, a alternativa era deixar meia linha
        vazia justamente ao lado do número que resume a tela.

        Abaixo de `sm` o valor cai para `text-lg` e o cartão para `p-3`, e isso não é estética.
        O formato pt-BR põe um espaço não-quebrável depois de "R$", então o valor é uma palavra
        só, que não quebra: em `text-2xl` numa coluna de meia tela ele vazava para fora do
        cartão em vez de se ajustar. Com o tamanho reduzido, os 112px úteis de um aparelho de
        320px comportam até "R$ 128.450,90"; num de 375px sobra folga para a casa dos milhões.
      */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm sm:p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Receitas</p>
          <p className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400 sm:text-2xl">{formatarMoeda(saldo?.totalReceitas ?? 0)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm sm:p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Despesas</p>
          <p className="mt-1 text-lg font-semibold text-red-600 dark:text-red-400 sm:text-2xl">{formatarMoeda(saldo?.totalDespesas ?? 0)}</p>
        </div>
        <div className="col-span-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm sm:col-span-1 sm:p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Saldo</p>
          <p className={`mt-1 text-lg font-semibold sm:text-2xl ${(saldo?.saldo ?? 0) >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-600 dark:text-red-400'}`}>
            {formatarMoeda(saldo?.saldo ?? 0)}
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Saldo por conta</h2>
        {contas.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma conta cadastrada.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            {/* Duas colunas cabem com folga de 2px numa tela de 375px — folga que um nome
                de conta mais longo consome. Com `overflow-hidden` o excesso era cortado em
                silêncio; rolando, no pior caso o usuário arrasta. */}
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {contas.map((conta) => (
                  <tr key={conta.id}>
                    <td className="px-4 py-2 text-slate-900 dark:text-slate-100">{conta.nome}</td>
                    <td
                      className={`px-4 py-2 text-right font-medium ${
                        conta.saldo >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatarMoeda(conta.saldo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Últimas transações</h2>
        {transacoesRecentes.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma transação cadastrada ainda.</p>
        ) : (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            {/* Ver Transacoes.tsx: abaixo de `sm` a tabela era cortada sem possibilidade
                de rolar, e o valor — o dado que se vem ao painel para ver — sumia. */}
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 sm:hidden">
              {transacoesRecentes.map((transacao) => (
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
                {transacoesRecentes.map((transacao) => (
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
}
