import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProvedorAutenticacao } from './contextos/ContextoAutenticacao'
import { RotaProtegida } from './componentes/RotaProtegida'
import { Layout } from './componentes/Layout'
import { Login } from './paginas/Login'
import { Registro } from './paginas/Registro'
import { Painel } from './paginas/Painel'
import { Transacoes } from './paginas/Transacoes'
import { Categorias } from './paginas/Categorias'
import { Contas } from './paginas/Contas'

function App() {
  return (
    <BrowserRouter>
      <ProvedorAutenticacao>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
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
          <Route
            path="/categorias"
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProvedorAutenticacao>
    </BrowserRouter>
  )
}

export default App
