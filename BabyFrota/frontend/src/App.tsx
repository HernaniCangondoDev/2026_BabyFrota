import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { TiposCarrinhoPage } from '@/pages/cadastros/TiposCarrinhoPage'
import { UsuariosPage } from '@/pages/cadastros/UsuariosPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />

          <Route path="/clientes" element={<PlaceholderPage title="Clientes" />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/carrinhos" element={<PlaceholderPage title="Carrinhos" />} />
          <Route path="/tipos-carrinho" element={<TiposCarrinhoPage />} />
          <Route path="/empresa" element={<PlaceholderPage title="Empresa" />} />

          <Route path="/locacao/entrega" element={<PlaceholderPage title="Entrega" />} />
          <Route path="/locacao/troca-devolucao" element={<PlaceholderPage title="Troca e Devolução" />} />

          <Route path="/caixa/abertura" element={<PlaceholderPage title="Abertura de Caixa" />} />
          <Route path="/caixa/fechamento" element={<PlaceholderPage title="Fechamento de Caixa" />} />
          <Route path="/caixa/suprimento-sangria" element={<PlaceholderPage title="Suprimento e Sangria" />} />

          <Route path="/etiquetas" element={<PlaceholderPage title="Geração de Etiquetas" />} />
          <Route path="/relatorios/clientes" element={<PlaceholderPage title="Relatório de Clientes" />} />
          <Route path="/relatorios/historico" element={<PlaceholderPage title="Histórico de Locações" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
