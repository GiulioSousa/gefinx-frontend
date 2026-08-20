import axios, { isAxiosError } from 'axios'

export const clienteApi = axios.create({
  baseURL: 'http://localhost:8080/api',
})

clienteApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let aoExpirarSessao: (() => void) | null = null

/**
 * Registra o que fazer quando a API rejeitar o token (401). Chamado pelo
 * ProvedorAutenticacao, que encerra a sessão — a RotaProtegida redireciona em seguida.
 */
export function registrarTratamentoDeSessaoExpirada(callback: () => void) {
  aoExpirarSessao = callback
}

clienteApi.interceptors.response.use(
  (resposta) => resposta,
  (erro: unknown) => {
    if (isAxiosError(erro) && erro.response?.status === 401) {
      // As rotas de autenticação também respondem 401 para credenciais
      // inválidas; ali o 401 é resposta esperada do formulário, não sessão
      // expirada, e não deve disparar o encerramento da sessão.
      const ehRotaDeAutenticacao = erro.config?.url?.includes('/auth/') ?? false
      if (!ehRotaDeAutenticacao) {
        aoExpirarSessao?.()
      }
    }
    return Promise.reject(erro)
  },
)
