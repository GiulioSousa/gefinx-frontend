import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAutenticacao } from '../contextos/ContextoAutenticacao'
import { ErroDeFormulario } from '../api/erros'
import { ErroDeCampo } from '../componentes/ErroDeCampo'

export function Registro() {
  const { registrar } = useAutenticacao()
  const navegar = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [errosPorCampo, setErrosPorCampo] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)

  // Com o campo culpado apontado, a mensagem geral vira ruído: ela diria "Dados
  // inválidos" logo acima da linha que já diz qual dado e por quê.
  const temErroDeCampo = Object.keys(errosPorCampo).length > 0

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro('')
    setErrosPorCampo({})
    setEnviando(true)
    try {
      await registrar(nome, email, senha)
      navegar('/')
    } catch (excecao) {
      const falha = ErroDeFormulario.de(excecao, 'Não foi possível criar a conta')
      setErro(falha.message)
      setErrosPorCampo(falha.porCampo)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">Criar conta</h1>
        <p className="mb-6 text-sm text-slate-500">Gerenciador Financeiro Pessoal</p>

        <form onSubmit={aoSubmeter} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
            <input
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <ErroDeCampo mensagem={errosPorCampo.nome} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <ErroDeCampo mensagem={errosPorCampo.email} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              required
              minLength={10}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <ErroDeCampo mensagem={errosPorCampo.senha} />
            <p className="mt-1 text-xs text-slate-500">No mínimo 10 caracteres.</p>
          </div>

          {erro && !temErroDeCampo && <p className="text-sm text-red-600">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {enviando ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-emerald-600 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
