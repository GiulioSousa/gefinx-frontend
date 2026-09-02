import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAutenticacao } from '../contextos/ContextoAutenticacao'
import { ErroDeFormulario } from '../api/erros'
import { ErroDeCampo } from '../componentes/ErroDeCampo'
import { BotaoDeTema } from '../componentes/BotaoDeTema'

export function Login() {
  const { entrar, sessaoExpirada } = useAutenticacao()
  const navegar = useNavigate()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [errosPorCampo, setErrosPorCampo] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)

  const temErroDeCampo = Object.keys(errosPorCampo).length > 0

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro('')
    setErrosPorCampo({})
    setEnviando(true)
    try {
      await entrar(usuario, senha)
      navegar('/')
    } catch (excecao) {
      const falha = ErroDeFormulario.de(excecao, 'Não foi possível entrar')
      setErro(falha.message)
      setErrosPorCampo(falha.porCampo)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      {/* Fora do Layout não há cabeçalho onde encaixar o botão, e trocar o tema só
          depois de entrar deixaria a primeira tela do app fora do controle do usuário. */}
      <BotaoDeTema className="absolute right-4 top-4" />

      <div className="w-full max-w-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Entrar</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">GeFinX · Gerenciador financeiro pessoal</p>

        {sessaoExpirada && !erro && (
          <p
            role="status"
            className="mb-4 rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-sm text-amber-800 dark:text-amber-200"
          >
            Sua sessão expirou. Entre novamente para continuar.
          </p>
        )}

        <form onSubmit={aoSubmeter} className="space-y-4">
          <div>
            <label htmlFor="usuario" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Usuário
            </label>
            <input
              id="usuario"
              name="usuario"
              // Sem o campo de e-mail, o navegador perde a pista que usava para oferecer a
              // credencial salva; `autoComplete` devolve essa pista de forma explícita.
              autoComplete="username"
              autoFocus
              value={usuario}
              onChange={(evento) => setUsuario(evento.target.value)}
              required
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
            <ErroDeCampo mensagem={errosPorCampo.usuario} />
          </div>
          <div>
            <label htmlFor="senha" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              required
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
            <ErroDeCampo mensagem={errosPorCampo.senha} />
          </div>

          {erro && !temErroDeCampo && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
