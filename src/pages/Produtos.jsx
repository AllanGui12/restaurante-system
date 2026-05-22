import { useEffect, useState } from 'react';

import {
  Pencil,
  Trash2,
  Plus,
  Package
} from 'lucide-react';

export default function Produtos() {

  const [produtos, setProdutos] = useState([]);

  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [estoque, setEstoque] = useState('');

  async function carregarProdutos() {

    const response = await fetch(
      'https://restaurante-api-2.onrender.com/produtos'
    );

    const data = await response.json();

    setProdutos(data);
  }

  async function salvarProduto() {

    if (!nome || !preco || estoque === '') {
      return;
    }

    await fetch(
      'https://restaurante-api-2.onrender.com/produtos',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          nome,
          preco,
          estoque,
        }),
      }
    );

    setNome('');
    setPreco('');
    setEstoque('');

    carregarProdutos();
  }

  async function excluirProduto(id) {

    const confirmar = window.confirm(
      'Deseja excluir este produto?'
    );

    if (!confirmar) return;

    await fetch(
      `https://restaurante-api-2.onrender.com/produtos/${id}`,
      {
        method: 'DELETE',
      }
    );

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          <input
            type="text"
            placeholder="Nome do produto"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="
              bg-[#0A0F1F]
              border
              border-zinc-700
              rounded-2xl
              px-5
              py-4
              outline-none
              text-white
              placeholder:text-zinc-500
            "
          />

          <input
            type="number"
            placeholder="Preço"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            className="
              bg-[#0A0F1F]
              border
              border-zinc-700
              rounded-2xl
              px-5
              py-4
              outline-none
              text-white
              placeholder:text-zinc-500
            "
          />

          <input
            type="number"
            placeholder="Estoque"
            value={estoque}
            onChange={(e) => setEstoque(e.target.value)}
            className="
              bg-[#0A0F1F]
              border
              border-zinc-700
              rounded-2xl
              px-5
              py-4
              outline-none
              text-white
              placeholder:text-zinc-500
            "
          />

          <button
            onClick={salvarProduto}
            className="
              bg-blue-600
              hover:bg-blue-700
              rounded-2xl
              font-bold
              flex
              items-center
              justify-center
              gap-2
              transition
            "
          >
            <Plus size={20} />

            Adicionar Produto
          </button>

        </div>

      </div>

      <div className="space-y-6">

        {produtos.map((produto) => (

          <div
            key={produto.id}
            className="
              bg-[#0B1120]
              border
              border-zinc-800
              rounded-3xl
              p-6
              flex
              justify-between
              items-center
            "
          >

            <div className="flex items-center gap-6">

              <div
                className="
                  w-20
                  h-20
                  rounded-full
                  border
                  border-zinc-700
                  flex
                  items-center
                  justify-center
                "
              >

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
                  R$ {Number(produto.preco).toFixed(2)}
                </p>

                <p
                  className={`
                    mt-2
                    text-xl
                    font-bold
                    ${
                      produto.estoque > 0
                        ? 'text-green-400'
                        : 'text-red-500'
                    }
                  `}
                >
                  {produto.estoque} unidades
                </p>

              </div>

            </div>

            <div className="flex gap-4">

              <button
                className="
                  bg-blue-600
                  hover:bg-blue-700
                  w-16
                  h-16
                  rounded-2xl
                  flex
                  items-center
                  justify-center
                "
              >
                <Pencil size={24} />
              </button>

              <button
                onClick={() => excluirProduto(produto.id)}
                className="
                  bg-red-500
                  hover:bg-red-600
                  w-16
                  h-16
                  rounded-2xl
                  flex
                  items-center
                  justify-center
                "
              >
                <Trash2 size={24} />
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>

  );
}