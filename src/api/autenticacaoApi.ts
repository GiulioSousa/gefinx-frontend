import { clienteApi } from './clienteApi'

export interface RespostaAutenticacao {
  token: string
  usuario: string
}

export async function login(usuario: string, senha: string): Promise<RespostaAutenticacao> {
  const { data } = await clienteApi.post<RespostaAutenticacao>('/auth/login', { usuario, senha })
  return data
}
