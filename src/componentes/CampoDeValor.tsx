import { useLayoutEffect, useRef } from 'react'

/**
 * O que a coluna `NUMERIC(14, 2)` comporta: 12 dígitos inteiros e 2 decimais. Um dígito além
 * disso é ignorado ao digitar, em vez de chegar à API e voltar como erro no campo.
 */
const MAXIMO_DE_DIGITOS = 14

const formatador = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

interface CampoDeValorProps {
  /** O valor em centavos: inteiro, sem a imprecisão de somar frações em ponto flutuante. */
  centavos: number
  aoMudar: (centavos: number) => void
  required?: boolean
  className?: string
}

/**
 * Valor monetário no modelo dos apps de banco: os dígitos entram pela direita, e as casas
 * decimais se preenchem sozinhas — "1" é R$ 0,01, "12" é R$ 0,12, "1234" é R$ 12,34. Não
 * há vírgula para digitar, nem teclado com ponto e vírgula para achar no celular.
 *
 * O campo não guarda texto: a cada mudança só os dígitos são lidos, e o texto é refeito a
 * partir deles. Por isso colar "1.234,56" também funciona, e apagar tira sempre o último
 * dígito.
 */
export function CampoDeValor({ centavos, aoMudar, required, className = '' }: CampoDeValorProps) {
  const campoRef = useRef<HTMLInputElement>(null)
  // Zero fica vazio, e não "R$ 0,00": assim o `required` do formulário recusa o envio
  // sem valor, e o placeholder mostra o formato que o campo espera.
  const texto = centavos > 0 ? formatador.format(centavos / 100) : ''

  /**
   * O cursor mora no fim do campo. Os dígitos sempre entram pela direita, então um cursor
   * no meio de "R$ 1.234,56" faria o próximo dígito aparecer num lugar e o valor mudar em
   * outro. Refeito a cada valor novo, porque trocar o texto do campo devolve o cursor.
   */
  function levarCursorAoFim() {
    const campo = campoRef.current
    if (campo && document.activeElement === campo) {
      campo.setSelectionRange(campo.value.length, campo.value.length)
    }
  }

  useLayoutEffect(levarCursorAoFim, [texto])

  return (
    <input
      ref={campoRef}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={texto}
      onChange={(evento) => {
        const digitos = evento.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, MAXIMO_DE_DIGITOS)
        aoMudar(digitos ? Number(digitos) : 0)
      }}
      onFocus={() => requestAnimationFrame(levarCursorAoFim)}
      onClick={levarCursorAoFim}
      required={required}
      placeholder={formatador.format(0)}
      className={className}
    />
  )
}
