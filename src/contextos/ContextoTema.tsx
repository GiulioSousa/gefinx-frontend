import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type Tema = 'claro' | 'escuro'

interface ContextoTemaValor {
  tema: Tema
  alternarTema: () => void
}

const ContextoTema = createContext<ContextoTemaValor | undefined>(undefined)

const CHAVE = 'tema'
const CONSULTA_ESCURO = '(prefers-color-scheme: dark)'

function preferenciaGravada(): Tema | null {
  const salvo = localStorage.getItem(CHAVE)
  return salvo === 'claro' || salvo === 'escuro' ? salvo : null
}

/**
 * A mesma regra do script em index.html, que roda antes do React para a tela não piscar.
 * Ler daqui o que já está no <html> seria mais curto, mas amarraria este estado ao acerto
 * daquele script — e ele existe justamente para poder falhar em silêncio.
 */
function temaInicial(): Tema {
  return preferenciaGravada() ?? (window.matchMedia(CONSULTA_ESCURO).matches ? 'escuro' : 'claro')
}

export function ProvedorTema({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(temaInicial)

  // A classe no <html> é o que o CSS enxerga; este estado só a acompanha.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'escuro')
  }, [tema])

  /*
    Enquanto o usuário não escolher um lado, quem manda é o sistema — inclusive quando ele
    muda no meio da sessão, como no anoitecer automático do Windows e do macOS. Depois da
    primeira escolha explícita, a preferência dele vence e o sistema deixa de ser ouvido.
  */
  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_ESCURO)

    function aoMudarOSistema(evento: MediaQueryListEvent) {
      if (preferenciaGravada() === null) {
        setTema(evento.matches ? 'escuro' : 'claro')
      }
    }

    consulta.addEventListener('change', aoMudarOSistema)
    return () => consulta.removeEventListener('change', aoMudarOSistema)
  }, [])

  const alternarTema = useCallback(() => {
    setTema((atual) => {
      const proximo: Tema = atual === 'claro' ? 'escuro' : 'claro'
      // Só grava a partir da primeira troca: um valor salvo já no primeiro carregamento
      // congelaria o tema no que o sistema dizia naquele instante, sem ninguém ter pedido.
      localStorage.setItem(CHAVE, proximo)
      return proximo
    })
  }, [])

  return <ContextoTema.Provider value={{ tema, alternarTema }}>{children}</ContextoTema.Provider>
}

export function useTema(): ContextoTemaValor {
  const contexto = useContext(ContextoTema)
  if (!contexto) {
    throw new Error('useTema deve ser usado dentro de um ProvedorTema')
  }
  return contexto
}
