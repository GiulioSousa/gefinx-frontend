import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAutenticacao } from '../contextos/ContextoAutenticacao'
import { extrairMensagemErro } from '../api/erros'

export function Registro() {
  const { registrar } = useAutenticacao()
  const navegar = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await registrar(nome, email, senha)
      navegar('/')
    } catch (excecao) {
      setErro(extrairMensagemErro(excecao, 'Não foi possível criar a conta'))
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
            <p className="mt-1 text-xs text-slate-500">No mínimo 10 caracteres.</p>
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

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
