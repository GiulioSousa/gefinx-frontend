import { useEffect, useState } from 'react'
import type { Categoria, TipoCategoria } from '../tipos'
import * as categoriasApi from '../api/categoriasApi'
import { FormularioCategoria } from '../componentes/FormularioCategoria'
import { ErroDeFormulario, extrairMensagemErro } from '../api/erros'

export function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState<Categoria | undefined>(undefined)

  async function carregarDados() {
    setCarregando(true)
    try {
      setCategorias(await categoriasApi.listarCategorias())
    } catch (excecao) {
      setErro(extrairMensagemErro(excecao, 'Não foi possível carregar as categorias'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  function abrirNovoFormulario() {
    setCategoriaEmEdicao(undefined)
    setMostrarFormulario(true)
  }

  function abrirEdicao(categoria: Categoria) {
    setCategoriaEmEdicao(categoria)
    setMostrarFormulario(true)
  }

  async function salvar(nome: string, tipo: TipoCategoria) {
    try {
      if (categoriaEmEdicao) {
        await categoriasApi.atualizarCategoria(categoriaEmEdicao.id, nome, tipo)
      } else {
        await categoriasApi.criarCategoria(nome, tipo)
      }
      setMostrarFormulario(false)
      setCategoriaEmEdicao(undefined)
      // O aviso descrevia uma falha anterior que o salvamento acabou de tornar passado.
      // Deixá-lo na tela faz a interface afirmar algo que já não é verdade.
      setErro('')
      await carregarDados()
    } catch (excecao) {
      // Repassa o erro inteiro, e não só a mensagem: o formulário precisa do mapa por
      // campo, que uma conversão para Error deixaria pelo caminho.
      throw ErroDeFormulario.de(excecao, 'Não foi possível salvar a categoria')
    }
  }

  async function excluir(id: number) {
    if (!window.confirm('Excluir esta categoria?')) {
      return
    }
    try {
      await categoriasApi.excluirCategoria(id)
      setErro('')
      await carregarDados()
    } catch (excecao) {
      setErro(extrairMensagemErro(excecao, 'Não foi possível excluir a categoria'))
    }
  }

  if (carregando) {
    return <p className="text-slate-500 dark:text-slate-400">Carregando...</p>
  }

  const receitas = categorias.filter((categoria) => categoria.tipo === 'RECEITA')
  const despesas = categorias.filter((categoria) => categoria.tipo === 'DESPESA')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Categorias</h1>
        {!mostrarFormulario && (
          <button
            onClick={abrirNovoFormulario}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Nova categoria
          </button>
        )}
      </div>

      {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

      {mostrarFormulario && (
        <FormularioCategoria
          categoriaInicial={categoriaEmEdicao}
          aoSalvar={salvar}
          aoCancelar={() => {
            setMostrarFormulario(false)
            setCategoriaEmEdicao(undefined)
          }}
        />
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <ListaCategorias titulo="Receitas" categorias={receitas} aoEditar={abrirEdicao} aoExcluir={excluir} />
        <ListaCategorias titulo="Despesas" categorias={despesas} aoEditar={abrirEdicao} aoExcluir={excluir} />
      </div>
    </div>
  )
}

interface ListaCategoriasProps {
  titulo: string
  categorias: Categoria[]
  aoEditar: (categoria: Categoria) => void
  aoExcluir: (id: number) => void
}

function ListaCategorias({ titulo, categorias, aoEditar, aoExcluir }: ListaCategoriasProps) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <h2 className="border-b border-slate-200 dark:border-slate-800 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{titulo}</h2>
      {categorias.length === 0 ? (
        <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">Nenhuma categoria cadastrada.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {categorias.map((categoria) => (
            <li key={categoria.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-slate-900 dark:text-slate-100">{categoria.nome}</span>
              <span className="flex gap-3">
                <button onClick={() => aoEditar(categoria)} className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                  Editar
                </button>
                <button
                  onClick={() => aoExcluir(categoria.id)}
                  className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
                >
                  Excluir
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
