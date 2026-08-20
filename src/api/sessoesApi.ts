import { clienteApi } from './clienteApi'

/**
 * Encerra todas as sessões do usuário no servidor, inclusive esta.
 *
 * Diferente do "Sair", que só apaga a cópia local do token: aqui o servidor passa a
 * recusar todo token emitido até agora, em qualquer aparelho.
 */
export async function encerrarTodasAsSessoes(): Promise<void> {
  await clienteApi.delete('/sessoes')
}
