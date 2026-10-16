import { clienteApi } from './clienteApi'
import type { RespostaAutenticacao } from './autenticacaoApi'

/**
 * Troca a senha de quem está na sessão. O servidor encerra todas as sessões, inclusive esta, e
 * devolve um token novo, como o login: é com ele que este aparelho continua.
 */
export async function trocarSenha(senhaAtual: string, novaSenha: string): Promise<RespostaAutenticacao> {
  const { data } = await clienteApi.put<RespostaAutenticacao>('/conta/senha', { senhaAtual, novaSenha })
  return data
}
