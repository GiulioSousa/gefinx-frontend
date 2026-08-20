import { isAxiosError } from 'axios'
import type { ErroApi } from '../tipos'

export function extrairMensagemErro(erro: unknown, mensagemPadrao = 'Ocorreu um erro inesperado'): string {
  if (isAxiosError<ErroApi>(erro) && erro.response?.data?.mensagem) {
    return erro.response.data.mensagem
  }
  return mensagemPadrao
}
