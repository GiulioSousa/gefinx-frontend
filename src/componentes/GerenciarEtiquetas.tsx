import { useState } from 'react'
import type { Etiqueta } from '../tipos'
import * as planejamentoApi from '../api/planejamentoApi'
import { ErroDeFormulario, extrairMensagemErro } from '../api/erros'
import { useConfirmacao } from '../contextos/ContextoConfirmacao'
import { EditorDeEtiqueta, SeloDaEtiqueta } from './etiquetas'

interface GerenciarEtiquetasProps {
  etiquetas: Etiqueta[]
  /** Depois de cada mudança: quem abriu relê a lista, que volta para cá pelas props. */
  aoMudar: () => Promise<void>
}

function descreverUso(despesas: number): string {
  if (despesas === 0) {
    return 'Nenhuma despesa'
  }
  return despesas === 1 ? '1 despesa' : `${despesas} despesas`
}

/**
 * Renomear, trocar a cor e excluir. Criar fica no formulário da despesa, onde a etiqueta nasce;
 * aqui se cuida das que já existem. Uma por vez em edição, no lugar da própria linha.
 */
export function GerenciarEtiquetas({ etiquetas, aoMudar }: GerenciarEtiquetasProps) {
  const [emEdicao, setEmEdicao] = useState<number | null>(null)
  const [erro, setErro] = useState('')
  const confirmar = useConfirmacao()

  async function salvar(etiqueta: Etiqueta, dados: planejamentoApi.DadosEtiqueta) {
    try {
      await planejamentoApi.atualizarEtiqueta(etiqueta.id, dados)
    } catch (excecao) {
      throw ErroDeFormulario.de(excecao, 'Não foi possível salvar a etiqueta')
    }
    setEmEdicao(null)
    await aoMudar()
  }

  async function excluir(etiqueta: Etiqueta) {
    // O número vai na mensagem: é ele que diz o tamanho do que se perde.
    let mensagem = `Excluir a etiqueta "${etiqueta.nome}"? Ela não marca nenhuma despesa.`
    if (etiqueta.despesas === 1) {
      mensagem = `Excluir a etiqueta "${etiqueta.nome}"? 1 despesa, pendente ou paga, está marcada com ela e a perderá. As outras etiquetas dela, o valor e o prazo não mudam.`
    } else if (etiqueta.despesas > 1) {
      mensagem = `Excluir a etiqueta "${etiqueta.nome}"? ${etiqueta.despesas} despesas, entre pendentes e pagas, estão marcadas com ela e a perderão. As outras etiquetas delas, os valores e os prazos não mudam.`
    }
    if (!(await confirmar({ titulo: 'Excluir etiqueta', mensagem, confirmar: 'Excluir', perigosa: true }))) {
      return
    }
    setErro('')
    try {
      await planejamentoApi.excluirEtiqueta(etiqueta.id)
      await aoMudar()
    } catch (excecao) {
      setErro(extrairMensagemErro(excecao, 'Não foi possível excluir a etiqueta'))
    }
  }

  if (etiquetas.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Nenhuma etiqueta ainda. Crie a primeira no formulário da despesa, em "Nova etiqueta".
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}
      <ul className="divide-y divide-slate-900/10 dark:divide-white/10">
        {etiquetas.map((etiqueta) => (
          <li key={etiqueta.id} className="py-2">
            {emEdicao === etiqueta.id ? (
              <EditorDeEtiqueta
                inicial={etiqueta}
                rotuloDoBotao="Salvar"
                aoSalvar={(dados) => salvar(etiqueta, dados)}
                aoCancelar={() => setEmEdicao(null)}
              />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 space-y-0.5">
                  <SeloDaEtiqueta etiqueta={etiqueta} />
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{descreverUso(etiqueta.despesas)}</span>
                </span>
                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setEmEdicao(etiqueta.id)}
                    aria-label={`Editar a etiqueta ${etiqueta.nome}`}
                    className="rounded-md px-2 py-1 text-sm font-medium text-emerald-700 hover:bg-slate-100 dark:text-emerald-400 dark:hover:bg-slate-800"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => excluir(etiqueta)}
                    aria-label={`Excluir a etiqueta ${etiqueta.nome}`}
                    className="rounded-md px-2 py-1 text-sm font-medium text-red-600 hover:bg-slate-100 dark:text-red-400 dark:hover:bg-slate-800"
                  >
                    Excluir
                  </button>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
