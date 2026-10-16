import { useState, type FormEvent } from 'react'
import { useAutenticacao } from '../contextos/ContextoAutenticacao'
import { ErroDeFormulario } from '../api/erros'
import { ErroDeCampo } from './ErroDeCampo'

const CAMPO =
  'w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm dark:text-slate-100 focus:border-emerald-500 focus:outline-none'

const ROTULO = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300'

/**
 * A política da nova senha é conferida no servidor, e os erros voltam por campo. Aqui só se
 * confere o que o servidor não tem como saber: se a confirmação bate com a nova.
 *
 * Depois de trocar, o formulário dá lugar ao aviso de que os outros aparelhos saíram — e não
 * fecha sozinho, para a pessoa ler isso.
 */
export function FormularioTrocaDeSenha({ aoFechar }: { aoFechar: () => void }) {
  const { trocarSenha } = useAutenticacao()
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [trocada, setTrocada] = useState(false)
  const [erro, setErro] = useState('')
  const [errosPorCampo, setErrosPorCampo] = useState<Record<string, string>>({})

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro('')
    setErrosPorCampo({})
    if (novaSenha !== confirmacao) {
      setErrosPorCampo({ confirmacao: 'A confirmação não é igual à nova senha' })
      return
    }
    setSalvando(true)
    try {
      await trocarSenha(senhaAtual, novaSenha)
      setTrocada(true)
    } catch (excecao) {
      const falha = ErroDeFormulario.de(excecao, 'Não foi possível alterar a senha')
      setErro(falha.message)
      setErrosPorCampo(falha.porCampo)
    } finally {
      setSalvando(false)
    }
  }

  if (trocada) {
    return (
      <div>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Senha alterada. Os outros aparelhos saíram da conta e vão pedir a senha nova; neste, você continua
          conectado.
        </p>
        <button
          type="button"
          onClick={aoFechar}
          data-foco-inicial
          className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Fechar
        </button>
      </div>
    )
  }

  const temErroDeCampo = Object.keys(errosPorCampo).length > 0

  return (
    <form onSubmit={aoSubmeter} className="space-y-4">
      <div>
        <label htmlFor="senha-atual" className={ROTULO}>
          Senha atual
        </label>
        <input
          id="senha-atual"
          type="password"
          autoComplete="current-password"
          value={senhaAtual}
          onChange={(evento) => setSenhaAtual(evento.target.value)}
          required
          data-foco-inicial
          className={CAMPO}
        />
        <ErroDeCampo mensagem={errosPorCampo.senhaAtual} />
      </div>

      <div>
        <label htmlFor="nova-senha" className={ROTULO}>
          Nova senha
        </label>
        <input
          id="nova-senha"
          type="password"
          autoComplete="new-password"
          value={novaSenha}
          onChange={(evento) => setNovaSenha(evento.target.value)}
          required
          className={CAMPO}
        />
        <ErroDeCampo mensagem={errosPorCampo.novaSenha} />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          No mínimo 10 caracteres. Uma frase longa protege mais que símbolos e números.
        </p>
      </div>

      <div>
        <label htmlFor="confirmacao" className={ROTULO}>
          Confirme a nova senha
        </label>
        <input
          id="confirmacao"
          type="password"
          autoComplete="new-password"
          value={confirmacao}
          onChange={(evento) => setConfirmacao(evento.target.value)}
          required
          className={CAMPO}
        />
        <ErroDeCampo mensagem={errosPorCampo.confirmacao} />
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Ao alterar, os outros aparelhos saem da conta.
      </p>

      {erro && !temErroDeCampo && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {salvando ? 'Alterando...' : 'Alterar senha'}
        </button>
        <button
          type="button"
          onClick={aoFechar}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
