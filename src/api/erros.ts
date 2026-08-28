import { isAxiosError, isCancel } from 'axios'
import type { ErroApi } from '../tipos'

/**
 * Se a requisição foi cancelada por quem a fez, e não recusada pelo servidor.
 *
 * Requisição cancelada não é falha: é o resultado esperado de o usuário ter pedido outra
 * coisa antes de esta chegar. Tratá-la como erro poria um aviso vermelho na tela a cada
 * troca rápida de filtro.
 */
export function foiCancelada(erro: unknown): boolean {
  return isCancel(erro)
}

export function extrairMensagemErro(erro: unknown, mensagemPadrao = 'Ocorreu um erro inesperado'): string {
  if (isAxiosError<ErroApi>(erro) && erro.response?.data?.mensagem) {
    return erro.response.data.mensagem
  }
  return mensagemPadrao
}

/**
 * O mapa `erros` da resposta 400, que diz qual campo falhou e por quê. Vazio para
 * qualquer outro erro — só a validação de borda o preenche.
 */
export function extrairErrosPorCampo(erro: unknown): Record<string, string> {
  if (isAxiosError<ErroApi>(erro) && erro.response?.data?.erros) {
    return erro.response.data.erros
  }
  return {}
}

/**
 * Falha ao submeter um formulário, com a mensagem geral e o que falhou em cada campo.
 *
 * <p>Existe porque a resposta da API atravessa duas fronteiras antes de virar tela: a
 * página trata a chamada, o formulário exibe o resultado. Convertendo para `Error` no meio
 * do caminho, como se fazia antes, o mapa `erros` era descartado e sobrava "Dados
 * inválidos" — o usuário ficava sabendo que algo estava errado, e nada sobre o quê.
 */
export class ErroDeFormulario extends Error {
  readonly porCampo: Record<string, string>

  constructor(mensagem: string, porCampo: Record<string, string> = {}) {
    super(mensagem)
    this.name = 'ErroDeFormulario'
    this.porCampo = porCampo
  }

  /**
   * Aceita tanto a exceção crua do axios quanto um erro já convertido, para servir aos
   * dois lados da fronteira sem que o chamador precise saber em qual deles está.
   */
  static de(erro: unknown, mensagemPadrao: string): ErroDeFormulario {
    if (erro instanceof ErroDeFormulario) {
      return erro
    }
    return new ErroDeFormulario(extrairMensagemErro(erro, mensagemPadrao), extrairErrosPorCampo(erro))
  }
}
