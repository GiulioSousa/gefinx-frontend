import { useId, useState, type KeyboardEvent } from 'react'
import type { CorDaEtiqueta, Etiqueta } from '../tipos'
import type { DadosEtiqueta } from '../api/planejamentoApi'
import { ErroDeFormulario } from '../api/erros'
import { CLASSE_DA_COR, CORES_DA_ETIQUETA } from './coresDaEtiqueta'
import { ErroDeCampo } from './ErroDeCampo'

const CAMPO =
  'w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm dark:text-slate-100 focus:border-emerald-500 focus:outline-none'

/**
 * A etiqueta no cartão. Cantos retos e a bolinha cheia a separam dos selos de situação, que são
 * pílulas só de texto: "Atrasada" é algo a resolver, "Nubank" é só uma marca.
 */
export function SeloDaEtiqueta({ etiqueta }: { etiqueta: Pick<Etiqueta, 'nome' | 'cor'> }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-md border border-current px-1.5 text-xs font-medium ${CLASSE_DA_COR[etiqueta.cor]}`}
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-current" aria-hidden="true" />
      <span className="truncate">{etiqueta.nome}</span>
    </span>
  )
}

/**
 * Os selos de uma despesa, na ordem da lista de etiquetas — a de nome —, e não na ordem em que
 * foram marcadas: assim "Nubank" fica sempre no mesmo lugar, de cartão em cartão. Um id que já
 * não está na lista é de uma etiqueta excluída, e não aparece.
 */
export function SelosDasEtiquetas({ ids, etiquetas }: { ids: number[]; etiquetas: Etiqueta[] }) {
  return etiquetas
    .filter((etiqueta) => ids.includes(etiqueta.id))
    .map((etiqueta) => <SeloDaEtiqueta key={etiqueta.id} etiqueta={etiqueta} />)
}

/** As dez bolinhas, como botões de rádio: as setas do teclado andam entre elas. */
function EscolhaDeCor({ cor, aoMudar }: { cor: CorDaEtiqueta; aoMudar: (cor: CorDaEtiqueta) => void }) {
  const grupo = useId()
  return (
    <fieldset>
      <legend className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Cor</legend>
      <div className="flex flex-wrap gap-1">
        {CORES_DA_ETIQUETA.map((opcao) => (
          <label
            key={opcao.cor}
            title={opcao.rotulo}
            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full has-checked:ring-2 has-checked:ring-current has-focus-visible:outline-2 has-focus-visible:outline-emerald-500 ${opcao.classe}`}
          >
            <input
              type="radio"
              name={grupo}
              value={opcao.cor}
              checked={cor === opcao.cor}
              onChange={() => aoMudar(opcao.cor)}
              aria-label={opcao.rotulo}
              className="sr-only"
            />
            <span className="h-6 w-6 rounded-full bg-current" aria-hidden="true" />
          </label>
        ))}
      </div>
    </fieldset>
  )
}

interface EditorDeEtiquetaProps {
  inicial?: Pick<Etiqueta, 'nome' | 'cor'>
  rotuloDoBotao: string
  aoSalvar: (dados: DadosEtiqueta) => Promise<void>
  aoCancelar: () => void
}

/**
 * Nome e cor, com uma prévia do selo. Não é um `<form>`: ele abre dentro do formulário da
 * despesa, e formulário dentro de formulário não existe. Por isso o Enter no nome é tratado
 * aqui — sem isso, ele salvaria a despesa, e não a etiqueta.
 */
export function EditorDeEtiqueta({ inicial, rotuloDoBotao, aoSalvar, aoCancelar }: EditorDeEtiquetaProps) {
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [cor, setCor] = useState<CorDaEtiqueta>(inicial?.cor ?? 'ROXO')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [errosPorCampo, setErrosPorCampo] = useState<Record<string, string>>({})
  const idDoNome = useId()

  const aparado = nome.trim()

  async function salvar() {
    if (aparado === '' || salvando) {
      return
    }
    setErro('')
    setErrosPorCampo({})
    setSalvando(true)
    try {
      await aoSalvar({ nome: aparado, cor })
    } catch (excecao) {
      const falha = ErroDeFormulario.de(excecao, 'Não foi possível salvar a etiqueta')
      setErro(falha.message)
      setErrosPorCampo(falha.porCampo)
    } finally {
      setSalvando(false)
    }
  }

  function aoTeclar(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Enter') {
      evento.preventDefault()
      salvar()
    }
  }

  const temErroDeCampo = Object.keys(errosPorCampo).length > 0

  return (
    <div className="space-y-3 rounded-md border border-slate-300 p-3 dark:border-slate-700">
      <div>
        <label htmlFor={idDoNome} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Nome
        </label>
        <input
          id={idDoNome}
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
          onKeyDown={aoTeclar}
          maxLength={30}
          autoFocus
          className={CAMPO}
          placeholder="Ex: Nubank"
        />
        <ErroDeCampo mensagem={errosPorCampo.nome} />
      </div>

      <EscolhaDeCor cor={cor} aoMudar={setCor} />

      {aparado !== '' && (
        <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          Prévia: <SeloDaEtiqueta etiqueta={{ nome: aparado, cor }} />
        </p>
      )}

      {erro && !temErroDeCampo && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={salvar}
          disabled={salvando || aparado === ''}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {salvando ? 'Salvando...' : rotuloDoBotao}
        </button>
        <button
          type="button"
          onClick={aoCancelar}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
