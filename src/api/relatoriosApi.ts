import { clienteApi } from './clienteApi'
import type { MesDoRelatorio, TotalDaCategoria } from '../tipos'

/** Meses no formato `2026-10`, inclusivos nas duas pontas; até 24. */
export async function buscarRelatorioMensal(inicio: string, fim: string): Promise<MesDoRelatorio[]> {
  const { data } = await clienteApi.get<MesDoRelatorio[]>('/relatorios/mensal', { params: { inicio, fim } })
  return data
}

/** Do maior total para o menor. Categoria sem lançamento no mês não vem. */
export async function buscarTotaisPorCategoria(mes: string, tipo: 'RECEITA' | 'DESPESA'): Promise<TotalDaCategoria[]> {
  const { data } = await clienteApi.get<TotalDaCategoria[]>('/relatorios/categorias', { params: { mes, tipo } })
  return data
}
