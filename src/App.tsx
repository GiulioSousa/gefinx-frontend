import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProvedorAutenticacao } from './contextos/ContextoAutenticacao'
import { ProvedorTema } from './contextos/ContextoTema'
import { ProvedorConfirmacao } from './contextos/ContextoConfirmacao'
import { RotaProtegida } from './componentes/RotaProtegida'
import { Layout } from './componentes/Layout'
import { Login } from './paginas/Login'
import { Painel } from './paginas/Painel'
import { Transacoes } from './paginas/Transacoes'
import { Categorias } from './paginas/Categorias'
import { Contas } from './paginas/Contas'
import { Planejamento } from './paginas/Planejamento'
import { Relatorios } from './paginas/Relatorios'

function App() {
  return (
    <ProvedorTema>
      <BrowserRouter>
        <ProvedorAutenticacao>
          <ProvedorConfirmacao>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <RotaProtegida>
                    <Layout>
                      <Painel />
                    </Layout>
                  </RotaProtegida>
                }
              />
              <Route
                path="/transacoes"
                element={
                  <RotaProtegida>
                    <Layout>
                      <Transacoes />
                    </Layout>
                  </RotaProtegida>
                }
              />
              {/* Dentro de Transações, onde se usa: a nav bar ficou só com os lugares de todo dia. */}
              <Route path="/categorias" element={<Navigate to="/transacoes/categorias" replace />} />
              <Route
                path="/transacoes/categorias"
                element={
                  <RotaProtegida>
                    <Layout>
                      <Categorias />
                    </Layout>
                  </RotaProtegida>
                }
              />
              <Route
                path="/contas"
                element={
                  <RotaProtegida>
                    <Layout>
                      <Contas />
                    </Layout>
                  </RotaProtegida>
                }
              />
              <Route
                path="/planejamento"
                element={
                  <RotaProtegida>
                    <Layout>
                      <Planejamento />
                    </Layout>
                  </RotaProtegida>
                }
              />
              <Route
                path="/relatorios"
                element={
                  <RotaProtegida>
                    <Layout>
                      <Relatorios />
                    </Layout>
                  </RotaProtegida>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ProvedorConfirmacao>
        </ProvedorAutenticacao>
      </BrowserRouter>
    </ProvedorTema>
  )
}

export default App
