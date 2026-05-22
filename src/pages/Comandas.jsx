import { useEffect, useState } from 'react';

const API_URL = 'https://restaurante-api-2.onrender.com';

export default function Comandas() {
  const [comandas, setComandas] = useState([]);
  const [produtos, setProdutos] = useState([]);

  const [cliente, setCliente] = useState('');
  const [tipo, setTipo] = useState('SALAO');

  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [quantidade, setQuantidade] = useState(1);

  async function carregarComandas() {
    try {
      const response = await fetch(`${API_URL}/comandas`);
      const data = await response.json();
      setComandas(Array.isArray(data) ? data : []);
    } catch {
      setComandas([]);
    }
  }

  async function carregarProdutos() {
    try {
      const response = await fetch(`${API_URL}/produtos`);
      const data = await response.json();
      setProdutos(Array.isArray(data) ? data : []);
    } catch {
      setProdutos([]);
    }
  }

  async function abrirComanda() {
    if (!cliente.trim()) return;

    await fetch(`${API_URL}/comandas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente, tipo }),
    });

    setCliente('');
    carregarComandas();
  }

  async function adicionarProduto(comandaId) {
    if (!produtoSelecionado) return;

    await fetch(`${API_URL}/comandas/${comandaId}/itens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produto_id: produtoSelecionado,
        quantidade,
      }),
    });

    setProdutoSelecionado('');
    setQuantidade(1);
    carregarComandas();
  }

  async function alterarQuantidade(itemId, novaQuantidade) {
    await fetch(`${API_URL}/itens/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantidade: novaQuantidade }),
    });

    carregarComandas();
  }

  async function fecharComanda(id) {
    const forma_pagamento = window.prompt(
      'Forma de pagamento: PIX, CREDITO, DEBITO ou DINHEIRO'
    );

    if (!forma_pagamento) return;

    await fetch(`${API_URL}/comandas/${id}/fechar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forma_pagamento }),
    });

    carregarComandas();
  }

  useEffect(() => {
    carregarComandas();
    carregarProdutos();
  }, []);

  const comandasAbertas = comandas.filter(
    (comanda) => comanda.status === 'ABERTA'
  );

  const historico = comandas.filter(
    (comanda) => comanda.status !== 'ABERTA'
  );

  return (
    <div className="bg-[#050816] min-h-screen text-white p-10">
      <h1 className="text-5xl font-bold mb-3">Comandas</h1>

      <p className="text-zinc-400 mb-10">
        Abra comandas, adicione produtos e acompanhe o histórico
      </p>

      <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-8 mb-10">
        <h2 className="text-3xl font-bold mb-6">Abrir Comanda</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Nome do cliente"
            className="bg-[#070D1A] border border-zinc-700 rounded-2xl px-5 py-4 text-zinc-200 outline-none"
          />

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="bg-[#070D1A] border border-zinc-700 rounded-2xl px-5 py-4 text-zinc-200 outline-none"
          >
            <option value="SALAO">Salão</option>
            <option value="DELIVERY">Delivery</option>
          </select>

          <button
            onClick={abrirComanda}
            className="bg-blue-600 hover:bg-blue-700 rounded-2xl px-8 py-4 font-bold"
          >
            Abrir Comanda
          </button>
        </div>
      </div>

      <h2 className="text-3xl font-bold mb-6">Comandas Abertas</h2>

      <div className="space-y-8 mb-12">
        {comandasAbertas.length === 0 && (
          <p className="text-zinc-500">Nenhuma comanda aberta</p>
        )}

        {comandasAbertas.map((comanda) => (
          <div
            key={comanda.id}
            className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-8"
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-4xl font-bold">{comanda.cliente}</h2>
                <p className="text-zinc-400 mt-2">Tipo: {comanda.tipo}</p>
                <p className="text-blue-400 font-bold mt-2">
                  Status: {comanda.status}
                </p>
              </div>

              <p className="text-5xl font-bold text-green-400">
                R$ {Number(comanda.total || 0).toFixed(2)}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <select
                value={produtoSelecionado}
                onChange={(e) => setProdutoSelecionado(e.target.value)}
                className="bg-[#070D1A] border border-zinc-700 rounded-2xl px-5 py-4 text-zinc-200 outline-none"
              >
                <option value="">Selecione um produto</option>

                {produtos.map((produto) => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="bg-[#070D1A] border border-zinc-700 rounded-2xl px-5 py-4 text-zinc-200 outline-none"
              />

              <button
                onClick={() => adicionarProduto(comanda.id)}
                className="bg-green-500 hover:bg-green-600 rounded-2xl px-8 py-4 font-bold"
              >
                Adicionar Produto
              </button>
            </div>

            <h3 className="text-2xl font-bold mb-4">Itens do pedido</h3>

            <div className="space-y-4">
              {comanda.itens?.length > 0 ? (
                comanda.itens.map((item, index) => (
                  <div
                    key={index}
                    className="bg-[#070D1A] border border-zinc-800 rounded-2xl p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-zinc-200 font-bold">{item.nome}</p>
                      <p className="text-green-400 font-bold mt-1">
                        {item.quantidade}x
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          alterarQuantidade(item.id, item.quantidade - 1)
                        }
                        className="bg-red-500 hover:bg-red-600 w-10 h-10 rounded-xl font-bold"
                      >
                        -
                      </button>

                      <span className="font-bold text-lg">
                        {item.quantidade}x
                      </span>

                      <button
                        onClick={() =>
                          alterarQuantidade(item.id, item.quantidade + 1)
                        }
                        className="bg-green-500 hover:bg-green-600 w-10 h-10 rounded-xl font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500">Nenhum item adicionado</p>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => fecharComanda(comanda.id)}
                className="bg-red-500 hover:bg-red-600 rounded-2xl px-8 py-4 font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-3xl font-bold mb-6">Histórico</h2>

      <div className="space-y-6">
        {historico.map((comanda) => (
          <div
            key={comanda.id}
            className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-6 flex justify-between items-center"
          >
            <div>
              <h3 className="text-2xl font-bold">{comanda.cliente}</h3>
              <p className="text-zinc-400">Tipo: {comanda.tipo}</p>
              <p className="text-zinc-400">
                Pagamento: {comanda.forma_pagamento || 'Não informado'}
              </p>
              <p className="text-blue-400 font-bold">{comanda.status}</p>
            </div>

            <p className="text-3xl font-bold text-green-400">
              R$ {Number(comanda.total || 0).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}