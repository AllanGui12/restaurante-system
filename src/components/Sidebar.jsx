import { Link } from 'react-router-dom';

export default function Sidebar({
  usuarioLogado,
  sair,
}) {
  return (
    <div className="w-64 h-screen bg-gray-900 dark:bg-black text-white p-5 flex flex-col border-r border-gray-800">
      <h1 className="text-3xl font-bold mb-4">
        Restaurante
      </h1>

      <div className="mb-8 text-sm text-gray-300">
        <p>{usuarioLogado.nome}</p>
        <p>{usuarioLogado.perfil}</p>
      </div>

      <nav className="flex flex-col gap-4 text-lg flex-1">
        {usuarioLogado.perfil === 'ADMIN' && (
          <Link to="/">Dashboard</Link>
        )}

        <Link to="/produtos">Produtos</Link>

        <Link to="/comandas">Comandas</Link>

        <Link to="/caixa">Caixa</Link>

        {usuarioLogado.perfil === 'ADMIN' && (
          <Link to="/estoque">Estoque</Link>
        )}
      </nav>

      <button
        onClick={sair}
        className="bg-red-600 text-white px-4 py-3 rounded-2xl hover:bg-red-700"
      >
        Sair
      </button>
    </div>
  );
}