import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import * as autenticacaoApi from '../api/autenticacaoApi'
import { registrarTratamentoDeSessaoExpirada } from '../api/clienteApi'

interface ContextoAutenticacaoValor {
  /** O nome de usuário de quem está na sessão, ou `null` quando não há sessão. */
  usuario: string | null
  carregando: boolean
  sessaoExpirada: boolean
  entrar: (usuario: string, senha: string) => Promise<void>
  sair: () => void
}

const ContextoAutenticacao = createContext<ContextoAutenticacaoValor | undefined>(undefined)

function limparArmazenamento() {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
  // Chaves do formato anterior, quando a conta tinha nome de exibição e e-mail. Removidas
  // junto porque quem já usava o sistema as tem guardadas, e ninguém mais as lê.
  localStorage.removeItem('usuarioNome')
  localStorage.removeItem('usuarioEmail')
}

export function ProvedorAutenticacao({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [sessaoExpirada, setSessaoExpirada] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const guardado = localStorage.getItem('usuario')
    if (token && guardado) {
      setUsuario(guardado)
    } else {
      // Sessão pela metade, ou guardada no formato anterior. Nos dois casos não há
      // identidade para restaurar, e deixar o token para trás só acumularia lixo.
      limparArmazenamento()
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

  async function entrar(nomeDeUsuario: string, senha: string) {
    const resposta = await autenticacaoApi.login(nomeDeUsuario, senha)
    localStorage.setItem('token', resposta.token)
    localStorage.setItem('usuario', resposta.usuario)
    setUsuario(resposta.usuario)
    setSessaoExpirada(false)
  }

  function sair() {
    limparArmazenamento()
    setUsuario(null)
    setSessaoExpirada(false)
  }

  return (
    <ContextoAutenticacao.Provider value={{ usuario, carregando, sessaoExpirada, entrar, sair }}>
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
