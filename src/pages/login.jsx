import { useState } from 'react';

export default function Login({ setUsuarioLogado }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  async function entrar(e) {
    e.preventDefault();

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usuario,
        senha,
      }),
    });

    if (!response.ok) {
      setErro('Usuário ou senha inválidos');
      return;
    }

    const data = await response.json();

    localStorage.setItem('usuarioLogado', JSON.stringify(data));

    setUsuarioLogado(data);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <form
        onSubmit={entrar}
        className="bg-white p-8 rounded-3xl shadow w-[400px]"
      >
        <h1 className="text-3xl font-bold mb-6">
          Login
        </h1>

        {erro && (
          <p className="bg-red-100 text-red-600 p-3 rounded-xl mb-4">
            {erro}
          </p>
        )}

        <input
          type="text"
          placeholder="Usuário"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="border rounded-2xl px-4 py-3 w-full mb-4"
          required
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="border rounded-2xl px-4 py-3 w-full mb-6"
          required
        />

        <button className="bg-blue-600 text-white rounded-2xl px-4 py-3 w-full hover:bg-blue-700">
          Entrar
        </button>

        <div className="text-sm text-gray-400 mt-6 text-center">
          <p> By Allan G.</p>
        </div>
      </form>
    </div>
  );
}