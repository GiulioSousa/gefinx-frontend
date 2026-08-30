import { useEffect, useState } from 'react'
import type { Conta } from '../tipos'
import * as contasApi from '../api/contasApi'
import type { DadosConta } from '../api/contasApi'
import { FormularioConta } from '../componentes/FormularioConta'
import { ErroDeFormulario, extrairMensagemErro } from '../api/erros'

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function Contas() {
  const [contas, setContas] = useState<Conta[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [contaEmEdicao, setContaEmEdicao] = useState<Conta | undefined>(undefined)

  async function carregarDados() {
    setCarregando(true)
    try {
      setContas(await contasApi.listarContas())
    } catch (excecao) {
      setErro(extrairMensagemErro(excecao, 'Não foi possível carregar as contas'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  function abrirNovoFormulario() {
    setContaEmEdicao(undefined)
    setMostrarFormulario(true)
  }

  function abrirEdicao(conta: Conta) {
    setContaEmEdicao(conta)
    setMostrarFormulario(true)
  }

  async function salvar(dados: DadosConta) {
    // Sem isto, o aviso de uma exclusão recusada continuaria na tela depois de um
    // salvamento bem-sucedido, descrevendo algo que já não é verdade.
    setErro('')
    try {
      if (contaEmEdicao) {
        await contasApi.atualizarConta(contaEmEdicao.id, dados.nome)
      } else {
        await contasApi.criarConta(dados)
      }
      setMostrarFormulario(false)
      setContaEmEdicao(undefined)
      await carregarDados()
    } catch (excecao) {
      // Ver Categorias.tsx: a conversão para Error descartava o mapa por campo.
      throw ErroDeFormulario.de(excecao, 'Não foi possível salvar a conta')
    }
  }

  async function excluir(id: number) {
    if (!window.confirm('Excluir esta conta?')) {
      return
    }
    setErro('')
    try {
      await contasApi.excluirConta(id)
      await carregarDados()
    } catch (excecao) {
      // Inclui o 409 de conta com transações, que é a recusa esperada e não uma falha.
      setErro(extrairMensagemErro(excecao, 'Não foi possível excluir a conta'))
    }
  }

  if (carregando) {
    return <p className="text-slate-500 dark:text-slate-400">Carregando...</p>
  }

  const total = contas.reduce((soma, conta) => soma + conta.saldo, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Contas</h1>
        {!mostrarFormulario && (
          <button
            onClick={abrirNovoFormulario}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Nova conta
          </button>
        )}
      </div>

      {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

      {mostrarFormulario && (
        <FormularioConta
          contaInicial={contaEmEdicao}
          aoSalvar={salvar}
          aoCancelar={() => {
            setMostrarFormulario(false)
            setContaEmEdicao(undefined)
          }}
        />
      )}

      {contas.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma conta cadastrada.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Conta</th>
                <th className="px-4 py-2 text-right font-medium">Saldo</th>
                <th className="px-4 py-2 text-right font-medium">Ações</th>
              </tr>
            </thead>
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
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => abrirEdicao(conta)}
                      className="mr-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Renomear
                    </button>
                    <button
                      onClick={() => excluir(conta.id)}
                      className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <td className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300">Consolidado</td>
                <td className={`px-4 py-2 text-right font-semibold ${total >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-600 dark:text-red-400'}`}>
                  {formatarMoeda(total)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
