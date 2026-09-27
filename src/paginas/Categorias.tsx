import { useEffect, useState } from 'react'
import type { Categoria, TipoCategoria } from '../tipos'
import * as categoriasApi from '../api/categoriasApi'
import { FormularioCategoria } from '../componentes/FormularioCategoria'
import { MenuFlutuante, OpcaoDoMenu } from '../componentes/MenuFlutuante'
import { LINHA_TOCAVEL, VIDRO } from '../componentes/vidro'
import { ErroDeFormulario, extrairMensagemErro } from '../api/erros'

export function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState<Categoria | undefined>(undefined)
  const [menu, setMenu] = useState<{ categoria: Categoria; ancora: HTMLElement } | null>(null)

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

  // Tocar de novo na categoria que abriu o menu o fecha; tocar em outra o leva para ela.
  function alternarMenu(categoria: Categoria, ancora: HTMLElement) {
    setMenu((atual) => (atual?.categoria.id === categoria.id ? null : { categoria, ancora }))
  }

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
        <ListaCategorias titulo="Receitas" categorias={receitas} idComMenu={menu?.categoria.id} aoTocar={alternarMenu} />
        <ListaCategorias titulo="Despesas" categorias={despesas} idComMenu={menu?.categoria.id} aoTocar={alternarMenu} />
      </div>

      {menu && (
        <MenuFlutuante rotulo={`Ações da categoria ${menu.categoria.nome}`} ancora={menu.ancora} aoFechar={() => setMenu(null)}>
          <OpcaoDoMenu
            aoEscolher={() => {
              setMenu(null)
              abrirEdicao(menu.categoria)
            }}
          >
            Editar
          </OpcaoDoMenu>
          <OpcaoDoMenu
            perigosa
            aoEscolher={() => {
              setMenu(null)
              excluir(menu.categoria.id)
            }}
          >
            Excluir
          </OpcaoDoMenu>
        </MenuFlutuante>
      )}
    </div>
  )
}

interface ListaCategoriasProps {
  titulo: string
  categorias: Categoria[]
  /** A categoria cujo menu está aberto, para o botão dela anunciar que está expandido. */
  idComMenu?: number
  aoTocar: (categoria: Categoria, ancora: HTMLElement) => void
}

function ListaCategorias({ titulo, categorias, idComMenu, aoTocar }: ListaCategoriasProps) {
  return (
    <div className={`rounded-lg ${VIDRO}`}>
      <h2 className="border-b border-slate-200 dark:border-slate-800 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{titulo}</h2>
      {categorias.length === 0 ? (
        <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">Nenhuma categoria cadastrada.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {categorias.map((categoria) => (
            <li key={categoria.id}>
              {/* A linha inteira é o botão: Editar e Excluir só aparecem no menu que ela abre. */}
              <button
                type="button"
                onClick={(evento) => aoTocar(categoria, evento.currentTarget)}
                aria-haspopup="true"
                aria-expanded={idComMenu === categoria.id}
                className={`${LINHA_TOCAVEL} w-full px-4 py-2.5 text-left text-sm text-slate-900 dark:text-slate-100`}
              >
                {categoria.nome}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
