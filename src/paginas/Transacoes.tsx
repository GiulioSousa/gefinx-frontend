import { useEffect, useState } from 'react'
import type { Categoria, Transacao } from '../tipos'
import { listarCategorias } from '../api/categoriasApi'
import * as transacoesApi from '../api/transacoesApi'
import type { DadosTransacao } from '../api/transacoesApi'
import { FormularioTransacao } from '../componentes/FormularioTransacao'
import { ErroDeFormulario, extrairMensagemErro } from '../api/erros'

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(data: string): string {
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR')
}

export function Transacoes() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [transacaoEmEdicao, setTransacaoEmEdicao] = useState<Transacao | undefined>(undefined)

  async function carregarDados() {
    setCarregando(true)
    try {
      const [transacoesObtidas, categoriasObtidas] = await Promise.all([
        transacoesApi.listarTransacoes(),
        listarCategorias(),
      ])
      setTransacoes(transacoesObtidas)
      setCategorias(categoriasObtidas)
    } catch (excecao) {
      setErro(extrairMensagemErro(excecao, 'Não foi possível carregar as transações'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

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
      await carregarDados()
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
      await carregarDados()
    } catch (excecao) {
      setErro(extrairMensagemErro(excecao, 'Não foi possível excluir a transação'))
    }
  }

  if (carregando) {
    return <p className="text-slate-500">Carregando...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Transações</h1>
        {!mostrarFormulario && (
          <button
            onClick={abrirNovoFormulario}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Nova transação
          </button>
        )}
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {mostrarFormulario && (
        <FormularioTransacao
          categorias={categorias}
          transacaoInicial={transacaoEmEdicao}
          aoSalvar={salvar}
          aoCancelar={() => {
            setMostrarFormulario(false)
            setTransacaoEmEdicao(undefined)
          }}
        />
      )}

      {transacoes.length === 0 ? (
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
                <th className="px-4 py-2 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transacoes.map((transacao) => (
                <tr key={transacao.id}>
                  <td className="px-4 py-2 text-slate-900">{transacao.descricao}</td>
                  <td className="px-4 py-2 text-slate-500">{transacao.nomeCategoria}</td>
                  <td className="px-4 py-2 text-slate-500">{formatarData(transacao.dataTransacao)}</td>
                  <td
                    className={`px-4 py-2 text-right font-medium ${
                      transacao.tipo === 'RECEITA' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {transacao.tipo === 'RECEITA' ? '+' : '-'} {formatarMoeda(transacao.valor)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => abrirEdicao(transacao)}
                      className="mr-3 text-sm font-medium text-emerald-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => excluir(transacao.id)}
                      className="text-sm font-medium text-red-600 hover:underline"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
