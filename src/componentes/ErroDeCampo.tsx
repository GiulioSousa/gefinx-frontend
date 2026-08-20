/**
 * Mensagem de erro logo abaixo do campo que a provocou. Não renderiza nada quando o campo
 * passou — assim o formulário pode declarar um destes sob cada campo sem condicional.
 */
export function ErroDeCampo({ mensagem }: { mensagem?: string }) {
  if (!mensagem) {
    return null
  }

  return <p className="mt-1 text-xs text-red-600">{mensagem}</p>
}
