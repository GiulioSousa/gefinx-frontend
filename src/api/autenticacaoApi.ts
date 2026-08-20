import { clienteApi } from './clienteApi'

export interface RespostaAutenticacao {
  token: string
  nome: string
  email: string
}

export async function registrar(nome: string, email: string, senha: string): Promise<RespostaAutenticacao> {
  const { data } = await clienteApi.post<RespostaAutenticacao>('/auth/registrar', { nome, email, senha })
  return data
}

export async function login(email: string, senha: string): Promise<RespostaAutenticacao> {
  const { data } = await clienteApi.post<RespostaAutenticacao>('/auth/login', { email, senha })
  return data
}
