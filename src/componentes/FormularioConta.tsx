import { useState, type FormEvent } from 'react'
import type { Conta } from '../tipos'
import type { DadosConta } from '../api/contasApi'
import { ErroDeFormulario } from '../api/erros'
import { ErroDeCampo } from './ErroDeCampo'

interface FormularioContaProps {
  contaInicial?: Conta
  aoSalvar: (dados: DadosConta) => Promise<void>
  aoCancelar: () => void
}

export function FormularioConta({ contaInicial, aoSalvar, aoCancelar }: FormularioContaProps) {
  const [nome, setNome] = useState(contaInicial?.nome ?? '')
  const [saldoInicial, setSaldoInicial] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [errosPorCampo, setErrosPorCampo] = useState<Record<string, string>>({})

  const editando = contaInicial !== undefined
  const temErroDeCampo = Object.keys(errosPorCampo).length > 0

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro('')
    setErrosPorCampo({})
    setSalvando(true)
    try {
      await aoSalvar({
        nome,
        saldoInicial: saldoInicial === '' ? undefined : Number(saldoInicial),
      })
    } catch (excecao) {
      const falha = ErroDeFormulario.de(excecao, 'Não foi possível salvar a conta')
      setErro(falha.message)
      setErrosPorCampo(falha.porCampo)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={aoSubmeter} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nome</label>
          <input
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            required
            maxLength={80}
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
            placeholder="Ex: Nubank"
          />
          <ErroDeCampo mensagem={errosPorCampo.nome} />
        </div>

        {/*
          Só na criação. O saldo inicial vira uma transação de abertura, e depois de
          criada ela é uma transação como as outras: quem quiser corrigir o valor edita a
          transação, na tela de transações. Repetir o campo aqui daria a entender que
          existe um segundo lugar guardando esse número.
        */}
        {!editando && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Saldo inicial (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={saldoInicial}
              onChange={(evento) => setSaldoInicial(evento.target.value)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
              placeholder="0,00"
            />
            <ErroDeCampo mensagem={errosPorCampo.saldoInicial} />
          </div>
        )}
      </div>

      {!editando && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          O saldo inicial entra como uma transação de abertura, que aparece na lista de transações.
        </p>
      )}

      {erro && !temErroDeCampo && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{erro}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={aoCancelar}
          className="rounded-md border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
