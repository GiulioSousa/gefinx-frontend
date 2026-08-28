import { useEffect, useState } from 'react'
import { buscarSaldo, listarTransacoes } from '../api/transacoesApi'
import { listarContas } from '../api/contasApi'
import type { Conta, Saldo, Transacao } from '../tipos'
import { extrairMensagemErro } from '../api/erros'

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
    return <p className="text-slate-500">Carregando...</p>
  }

  if (erro) {
    return <p className="text-red-600">{erro}</p>
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Receitas</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">{formatarMoeda(saldo?.totalReceitas ?? 0)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Despesas</p>
          <p className="mt-1 text-2xl font-semibold text-red-600">{formatarMoeda(saldo?.totalDespesas ?? 0)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Saldo</p>
          <p className={`mt-1 text-2xl font-semibold ${(saldo?.saldo ?? 0) >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
            {formatarMoeda(saldo?.saldo ?? 0)}
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Saldo por conta</h2>
        {contas.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma conta cadastrada.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-slate-100">
                {contas.map((conta) => (
                  <tr key={conta.id}>
                    <td className="px-4 py-2 text-slate-900">{conta.nome}</td>
                    <td
                      className={`px-4 py-2 text-right font-medium ${
                        conta.saldo >= 0 ? 'text-slate-900' : 'text-red-600'
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
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Últimas transações</h2>
        {transacoesRecentes.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma transação cadastrada ainda.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Descrição</th>
                  <th className="px-4 py-2 font-medium">Categoria</th>
                  <th className="px-4 py-2 font-medium">Data</th>
                  <th className="px-4 py-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transacoesRecentes.map((transacao) => (
                  <tr key={transacao.id}>
                    <td className="px-4 py-2 text-slate-900">{transacao.descricao}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {transacao.nomeCategoria ??
                        (transacao.nomeContaDestino
                          ? `${transacao.nomeConta} → ${transacao.nomeContaDestino}`
                          : '—')}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{formatarData(transacao.dataTransacao)}</td>
                    {/* Ver Transacoes.tsx: transferência não sobe nem desce patrimônio. */}
                    <td
                      className={`px-4 py-2 text-right font-medium ${
                        transacao.tipo === 'TRANSFERENCIA'
                          ? 'text-slate-600'
                          : transacao.tipo === 'RECEITA'
                            ? 'text-emerald-600'
                            : 'text-red-600'
                      }`}
                    >
                      {transacao.tipo === 'TRANSFERENCIA' ? '' : transacao.tipo === 'RECEITA' ? '+ ' : '- '}
                      {formatarMoeda(transacao.valor)}
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
