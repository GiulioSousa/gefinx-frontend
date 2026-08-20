import { clienteApi } from './clienteApi'
import type { Categoria, TipoTransacao } from '../tipos'

export async function listarCategorias(): Promise<Categoria[]> {
  const { data } = await clienteApi.get<Categoria[]>('/categorias')
  return data
}

export async function criarCategoria(nome: string, tipo: TipoTransacao): Promise<Categoria> {
  const { data } = await clienteApi.post<Categoria>('/categorias', { nome, tipo })
  return data
}

export async function atualizarCategoria(id: number, nome: string, tipo: TipoTransacao): Promise<Categoria> {
  const { data } = await clienteApi.put<Categoria>(`/categorias/${id}`, { nome, tipo })
  return data
}

export async function excluirCategoria(id: number): Promise<void> {
  await clienteApi.delete(`/categorias/${id}`)
}
