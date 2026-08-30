import { useMemo, useState, type FormEvent } from 'react'
import type { Categoria, Conta, TipoTransacao, Transacao } from '../tipos'
import type { DadosTransacao } from '../api/transacoesApi'
import { ErroDeFormulario } from '../api/erros'
import { ErroDeCampo } from './ErroDeCampo'

interface FormularioTransacaoProps {
  categorias: Categoria[]
  contas: Conta[]
  transacaoInicial?: Transacao
  aoSalvar: (dados: DadosTransacao) => Promise<void>
  aoCancelar: () => void
}

function dataDeHoje(): string {
  return new Date().toISOString().slice(0, 10)
}

export function FormularioTransacao({
  categorias,
  contas,
  transacaoInicial,
  aoSalvar,
  aoCancelar,
}: FormularioTransacaoProps) {
  const [descricao, setDescricao] = useState(transacaoInicial?.descricao ?? '')
  const [valor, setValor] = useState(transacaoInicial ? String(transacaoInicial.valor) : '')
  const [tipo, setTipo] = useState<TipoTransacao>(transacaoInicial?.tipo ?? 'DESPESA')
  const [categoriaId, setCategoriaId] = useState<number | ''>(transacaoInicial?.categoriaId ?? '')
  // Pré-seleciona quando só existe uma conta: nesse caso não há escolha a fazer, e
  // obrigar o clique seria atrito sem informação. Com duas ou mais, quem escolhe é o
  // usuário — escolher por ele lançaria dinheiro na conta errada em silêncio.
  const [contaId, setContaId] = useState<number | ''>(
    transacaoInicial?.contaId ?? (contas.length === 1 ? contas[0].id : '')
  )
  const [contaDestinoId, setContaDestinoId] = useState<number | ''>(transacaoInicial?.contaDestinoId ?? '')
  const [dataTransacao, setDataTransacao] = useState(transacaoInicial?.dataTransacao ?? dataDeHoje())
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [errosPorCampo, setErrosPorCampo] = useState<Record<string, string>>({})

  const ehTransferencia = tipo === 'TRANSFERENCIA'
  const temErroDeCampo = Object.keys(errosPorCampo).length > 0
  const contasInsuficientes = ehTransferencia && contas.length < 2

  const categoriasDoTipo = useMemo(
    () => categorias.filter((categoria) => categoria.tipo === tipo),
    [categorias, tipo]
  )

  // A conta de origem não pode ser destino de si mesma: tirá-la da lista evita oferecer
  // uma opção que o servidor recusaria.
  const contasDeDestino = useMemo(
    () => contas.filter((conta) => conta.id !== contaId),
    [contas, contaId]
  )

  function trocarTipo(novoTipo: TipoTransacao) {
    setTipo(novoTipo)
    // Os dois campos são exclusivos entre si; deixar o valor antigo faria a requisição
    // carregar um campo que não pertence ao formato escolhido.
    setCategoriaId('')
    setContaDestinoId('')
  }

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro('')
    setErrosPorCampo({})

    if (contaId === '') {
      setErro('Selecione uma conta')
      return
    }

    if (ehTransferencia) {
      if (contaDestinoId === '') {
        setErro('Selecione a conta de destino')
        return
      }
    } else if (categoriaId === '') {
      setErro('Selecione uma categoria')
      return
    }

    setSalvando(true)
    try {
      await aoSalvar({
        descricao,
        valor: Number(valor),
        tipo,
        contaId,
        categoriaId: ehTransferencia ? undefined : (categoriaId as number),
        contaDestinoId: ehTransferencia ? (contaDestinoId as number) : undefined,
        dataTransacao,
      })
    } catch (excecao) {
      const falha = ErroDeFormulario.de(excecao, 'Não foi possível salvar a transação')
      setErro(falha.message)
      setErrosPorCampo(falha.porCampo)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={aoSubmeter} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Descrição</label>
          <input
            value={descricao}
            onChange={(evento) => setDescricao(evento.target.value)}
            required
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
            placeholder={ehTransferencia ? 'Ex: Reserva do mes' : 'Ex: Supermercado'}
          />
          <ErroDeCampo mensagem={errosPorCampo.descricao} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo</label>
          <select
            value={tipo}
            onChange={(evento) => trocarTipo(evento.target.value as TipoTransacao)}
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
          >
            <option value="DESPESA">Despesa</option>
            <option value="RECEITA">Receita</option>
            <option value="TRANSFERENCIA">Transferência</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={valor}
            onChange={(evento) => setValor(evento.target.value)}
            required
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
            placeholder="0,00"
          />
          <ErroDeCampo mensagem={errosPorCampo.valor} />
        </div>

        {!ehTransferencia && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Categoria</label>
            <select
              value={categoriaId}
              onChange={(evento) => setCategoriaId(Number(evento.target.value))}
              required
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="" disabled>
                Selecione...
              </option>
              {categoriasDoTipo.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
            <ErroDeCampo mensagem={errosPorCampo.categoriaId} />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {ehTransferencia ? 'Conta de origem' : 'Conta'}
          </label>
          <select
            value={contaId}
            onChange={(evento) => setContaId(Number(evento.target.value))}
            required
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
          >
            <option value="" disabled>
              Selecione...
            </option>
            {contas.map((conta) => (
              <option key={conta.id} value={conta.id}>
                {conta.nome}
              </option>
            ))}
          </select>
          <ErroDeCampo mensagem={errosPorCampo.contaId} />
        </div>

        {ehTransferencia && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Conta de destino</label>
            <select
              value={contaDestinoId}
              onChange={(evento) => setContaDestinoId(Number(evento.target.value))}
              required
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="" disabled>
                Selecione...
              </option>
              {contasDeDestino.map((conta) => (
                <option key={conta.id} value={conta.id}>
                  {conta.nome}
                </option>
              ))}
            </select>
            <ErroDeCampo mensagem={errosPorCampo.contaDestinoId} />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Data</label>
          <input
            type="date"
            value={dataTransacao}
            onChange={(evento) => setDataTransacao(evento.target.value)}
            required
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
          />
          <ErroDeCampo mensagem={errosPorCampo.dataTransacao} />
        </div>
      </div>

      {ehTransferencia && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Transferência move dinheiro entre suas contas: não entra como receita nem como despesa, e o saldo
          consolidado não muda.
        </p>
      )}

      {contasInsuficientes && (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
          É preciso ter pelo menos duas contas para transferir. Cadastre outra na tela de Contas.
        </p>
      )}

      {erro && !temErroDeCampo && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{erro}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={salvando || contasInsuficientes}
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
