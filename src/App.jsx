import { useState } from 'react';

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Comandas from './pages/Comandas';
import Caixa from './pages/Caixa';
import Estoque from './pages/Estoque';
import Configuracoes from './pages/Configuracoes';

export default function App() {
  const [usuarioLogado, setUsuarioLogado] =
    useState(() => {
      const usuarioSalvo =
        localStorage.getItem('usuarioLogado');

      return usuarioSalvo
        ? JSON.parse(usuarioSalvo)
        : null;
    });

  function sair() {
    localStorage.removeItem('usuarioLogado');
    setUsuarioLogado(null);
  }

  if (!usuarioLogado) {
    return (
      <Login setUsuarioLogado={setUsuarioLogado} />
    );
  }

  return (
    <BrowserRouter>
      <div className="flex">
        <Sidebar
          usuarioLogado={usuarioLogado}
          sair={sair}
        />

        <div className="flex-1 p-8 bg-gray-100 dark:bg-gray-950 min-h-screen text-black dark:text-white">
          <Routes>
            {usuarioLogado.perfil === 'ADMIN' && (
              <>
                <Route
                  path="/"
                  element={<Dashboard />}
                />

                <Route
                  path="/estoque"
                  element={<Estoque />}
                />
              </>
            )}

            <Route
              path="/produtos"
              element={<Produtos />}
            />

            <Route
              path="/comandas"
              element={<Comandas />}
            />

            <Route
              path="/caixa"
              element={<Caixa />}
            />

            <Route
  path="/configuracoes"
  element={<Configuracoes />}
/>

            <Route
              path="*"
              element={
                <Navigate
                  to={
                    usuarioLogado.perfil === 'ADMIN'
                      ? '/'
                      : '/comandas'
                  }
                />
              }
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}