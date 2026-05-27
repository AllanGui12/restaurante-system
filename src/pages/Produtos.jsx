import { useEffect, useState } from 'react';

import {
  Pencil,
  Trash2,
  Plus,
  Package
} from 'lucide-react';

const API_URL = 'https://restaurante-api-2.onrender.com';

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);

  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [custo, setCusto] = useState('');
  const [estoque, setEstoque] = useState('');

  const [editandoId, setEditandoId] = useState(null);

  async function carregarProdutos() {
    try {
      const response = await fetch(`${API_URL}/produtos`);
      const data = await response.json();

      setProdutos(Array.isArray(data) ? data : []);
    } catch {
      setProdutos([]);
    }
  }

  function editarProduto(produto) {
    setEditandoId(produto.id);
    setNome(produto.nome);
    setPreco(produto.preco);
    setCusto(produto.custo || '');
    setEstoque(produto.estoque);
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome('');
    setPreco('');
    setCusto('');
    setEstoque('');
  }

  async function salvarProduto() {
    if (!nome || !preco || estoque === '') {
      return;
    }

    if (editandoId) {
      await fetch(`${API_URL}/produtos/${editandoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome,
          preco,
          custo: custo || 0,
          estoque,
        }),
      });

      limparFormulario();
      carregarProdutos();
      return;
    }

    await fetch(`${API_URL}/produtos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome,
        preco,
        custo: custo || 0,
        estoque,
      }),
    });

    limparFormulario();
    carregarProdutos();
  }

  async function excluirProduto(id) {
    const confirmar = window.confirm(
      'Deseja excluir este produto?'
    );

    if (!confirmar) return;

    await fetch(`${API_URL}/produtos/${id}`, {
      method: 'DELETE',
    });

    carregarProdutos();
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  return (
    <div className="bg-[#050816] min-h-screen p-6 text-white">
      <h1 className="text-4xl font-bold mb-8">
        Produtos
      </h1>

      <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Nome do produto"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="bg-[#0A0F1F] border border-zinc-700 rounded-2xl px-5 py-4 outline-none text-white placeholder:text-zinc-500"
          />

          <input
            type="number"
            placeholder="Preço de venda"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            className="bg-[#0A0F1F] border border-zinc-700 rounded-2xl px-5 py-4 outline-none text-white placeholder:text-zinc-500"
          />

          <input
            type="number"
            placeholder="Custo opcional"
            value={custo}
            onChange={(e) => setCusto(e.target.value)}
            className="bg-[#0A0F1F] border border-zinc-700 rounded-2xl px-5 py-4 outline-none text-white placeholder:text-zinc-500"
          />

          <input
            type="number"
            placeholder="Estoque"
            value={estoque}
            onChange={(e) => setEstoque(e.target.value)}
            className="bg-[#0A0F1F] border border-zinc-700 rounded-2xl px-5 py-4 outline-none text-white placeholder:text-zinc-500"
          />

          <button
            onClick={salvarProduto}
            className="bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold flex items-center justify-center gap-2 transition py-4"
          >
            <Plus size={20} />
            {editandoId ? 'Salvar Alteração' : 'Adicionar Produto'}
          </button>
        </div>

        {editandoId && (
          <button
            onClick={limparFormulario}
            className="mt-4 text-zinc-400 hover:text-white"
          >
            Cancelar edição
          </button>
        )}
      </div>

      <div className="space-y-6">
        {produtos.map((produto) => {
          const precoVenda = Number(produto.preco || 0);
          const custoProduto = Number(produto.custo || 0);
          const lucroUnitario = precoVenda - custoProduto;

          return (
            <div
              key={produto.id}
              className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-6 flex justify-between items-center"
            >
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full border border-zinc-700 flex items-center justify-center">
                  <Package
                    size={36}
                    className="text-blue-500"
                  />
                </div>

                <div>
                  <h2 className="text-3xl font-bold">
                    {produto.nome}
                  </h2>

                  <p className="text-blue-500 text-2xl font-bold mt-2">
                    Venda: R$ {precoVenda.toFixed(2)}
                  </p>

                  <p className="text-yellow-400 text-lg font-bold mt-1">
                    Custo: R$ {custoProduto.toFixed(2)}
                  </p>

                  <p className="text-green-400 text-lg font-bold mt-1">
                    Lucro unitário: R$ {lucroUnitario.toFixed(2)}
                  </p>

                  <p
                    className={`mt-2 text-xl font-bold ${
                      Number(produto.estoque) > 0
                        ? 'text-green-400'
                        : 'text-red-500'
                    }`}
                  >
                    {produto.estoque} unidades
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => editarProduto(produto)}
                  className="bg-blue-600 hover:bg-blue-700 w-16 h-16 rounded-2xl flex items-center justify-center"
                >
                  <Pencil size={24} />
                </button>

                <button
                  onClick={() => excluirProduto(produto.id)}
                  className="bg-red-500 hover:bg-red-600 w-16 h-16 rounded-2xl flex items-center justify-center"
                >
                  <Trash2 size={24} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}