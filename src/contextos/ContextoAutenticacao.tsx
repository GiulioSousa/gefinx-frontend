import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import * as autenticacaoApi from '../api/autenticacaoApi'
import { registrarTratamentoDeSessaoExpirada } from '../api/clienteApi'
import type { Usuario } from '../tipos'

interface ContextoAutenticacaoValor {
  usuario: Usuario | null
  carregando: boolean
  sessaoExpirada: boolean
  entrar: (email: string, senha: string) => Promise<void>
  registrar: (nome: string, email: string, senha: string) => Promise<void>
  sair: () => void
}

const ContextoAutenticacao = createContext<ContextoAutenticacaoValor | undefined>(undefined)

function limparArmazenamento() {
  localStorage.removeItem('token')
  localStorage.removeItem('usuarioNome')
  localStorage.removeItem('usuarioEmail')
}

export function ProvedorAutenticacao({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [sessaoExpirada, setSessaoExpirada] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const nome = localStorage.getItem('usuarioNome')
    const email = localStorage.getItem('usuarioEmail')
    if (token && nome && email) {
      setUsuario({ nome, email })
    }
    setCarregando(false)
  }, [])

  const expirarSessao = useCallback(() => {
    limparArmazenamento()
    setUsuario(null)
    setSessaoExpirada(true)
  }, [])

  useEffect(() => {
    registrarTratamentoDeSessaoExpirada(expirarSessao)
  }, [expirarSessao])

  function salvarSessao(token: string, nome: string, email: string) {
    localStorage.setItem('token', token)
    localStorage.setItem('usuarioNome', nome)
    localStorage.setItem('usuarioEmail', email)
    setUsuario({ nome, email })
    setSessaoExpirada(false)
  }

  async function entrar(email: string, senha: string) {
    const resposta = await autenticacaoApi.login(email, senha)
    salvarSessao(resposta.token, resposta.nome, resposta.email)
  }

  async function registrar(nome: string, email: string, senha: string) {
    const resposta = await autenticacaoApi.registrar(nome, email, senha)
    salvarSessao(resposta.token, resposta.nome, resposta.email)
  }

  function sair() {
    limparArmazenamento()
    setUsuario(null)
    setSessaoExpirada(false)
  }

  return (
    <ContextoAutenticacao.Provider
      value={{ usuario, carregando, sessaoExpirada, entrar, registrar, sair }}
    >
      {children}
    </ContextoAutenticacao.Provider>
  )
}

export function useAutenticacao(): ContextoAutenticacaoValor {
  const contexto = useContext(ContextoAutenticacao)
  if (!contexto) {
    throw new Error('useAutenticacao deve ser usado dentro de um ProvedorAutenticacao')
  }
  return contexto
}
