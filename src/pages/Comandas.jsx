import { useEffect, useState } from 'react';

export default function Comandas() {

  const [comandas, setComandas] = useState([]);

  const [cliente, setCliente] = useState('');
  const [tipo, setTipo] = useState('Mesa');

  const [produtos, setProdutos] = useState([]);

  const [produtoSelecionado, setProdutoSelecionado] =
    useState('');

  const [quantidade, setQuantidade] =
    useState(1);

  async function carregarComandas() {

    const response = await fetch(
      'https://restaurante-api-2.onrender.com/comandas'
    );

    const data = await response.json();

    setComandas(data);
  }

  async function carregarProdutos() {

    const response = await fetch(
      'https://restaurante-api-2.onrender.com/produtos'
    );

    const data = await response.json();

    setProdutos(data);
  }

  async function criarComanda() {

    if (!cliente) return;

    await fetch(
      'https://restaurante-api-2.onrender.com/comandas',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          cliente,
          tipo,
        }),
      }
    );

    setCliente('');

    carregarComandas();
  }

  async function adicionarProduto(comandaId) {

    if (!produtoSelecionado) return;

    await fetch(
      `https://restaurante-api-2.onrender.com/comandas/${comandaId}/itens`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          produto_id: produtoSelecionado,
          quantidade,
        }),
      }
    );

    setProdutoSelecionado('');
    setQuantidade(1);

    carregarComandas();
  }

  async function fecharComanda(id) {

    await fetch(
      `https://restaurante-api-2.onrender.com/comandas/${id}/fechar`,
      {
        method: 'PUT',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          forma_pagamento: 'PIX',
        }),
      }
    );

    carregarComandas();
  }

  useEffect(() => {
    carregarComandas();
    carregarProdutos();
  }, []);

  return (

    <div className="bg-[#050816] min-h-screen text-white p-10">

      <h1 className="text-5xl font-bold mb-3">
        Comandas
      </h1>

      <p className="text-zinc-400 mb-10">
        Gerencie os itens e produtos das comandas
      </p>

      {/* NOVA COMANDA */}

      <div
        className="
          bg-[#0B1120]
          border
          border-zinc-800
          rounded-3xl
          p-8
          mb-8
        "
      >

        <h2 className="text-3xl font-bold mb-6">
          Nova Comanda
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <input
            type="text"
            placeholder="Nome do cliente"
            value={cliente}
            onChange={(e) =>
              setCliente(e.target.value)
            }
            className="
              bg-[#070D1A]
              border
              border-zinc-700
              rounded-2xl
              px-5
              py-4
              text-zinc-200
              outline-none
            "
          />

          <select
            value={tipo}
            onChange={(e) =>
              setTipo(e.target.value)
            }
            className="
              bg-[#070D1A]
              border
              border-zinc-700
              rounded-2xl
              px-5
              py-4
              text-zinc-200
              outline-none
            "
          >
            <option>Mesa</option>
            <option>Delivery</option>
            <option>Balcão</option>
          </select>

          <button
            onClick={criarComanda}
            className="
              bg-green-500
              hover:bg-green-600
              rounded-2xl
              px-8
              py-4
              font-bold
            "
          >
            Criar Comanda
          </button>

        </div>

      </div>

      {/* LISTA */}

      <div className="space-y-8">

        {comandas.map((comanda) => (

          <div
            key={comanda.id}
            className="
              bg-[#0B1120]
              border
              border-zinc-800
              rounded-3xl
              p-8
            "
          >

            <div
              className="
                flex
                justify-between
                items-center
                mb-8
              "
            >

              <div>

                <h2 className="text-4xl font-bold">
                  {comanda.cliente}
                </h2>

                <p className="text-zinc-400 mt-2">
                  {comanda.tipo}
                </p>

                <p className="text-blue-400 font-bold mt-2">
                  Status: {comanda.status}
                </p>

              </div>

              <div className="text-right">

                <p
                  className="
                    text-5xl
                    font-bold
                    text-green-400
                  "
                >
                  R$ {Number(comanda.total).toFixed(2)}
                </p>

              </div>

            </div>

            {/* ADICIONAR PRODUTO */}

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-3
                gap-4
                mb-8
              "
            >

              <select
                value={produtoSelecionado}
                onChange={(e) =>
                  setProdutoSelecionado(
                    e.target.value
                  )
                }
                className="
                  bg-[#070D1A]
                  border
                  border-zinc-700
                  rounded-2xl
                  px-5
                  py-4
                  text-zinc-200
                  outline-none
                "
              >

                <option value="">
                  Selecione um produto
                </option>

                {produtos.map((produto) => (

                  <option
                    key={produto.id}
                    value={produto.id}
                  >
                    {produto.nome}
                  </option>

                ))}

              </select>

              <input
                type="number"
                value={quantidade}
                onChange={(e) =>
                  setQuantidade(e.target.value)
                }
                className="
                  bg-[#070D1A]
                  border
                  border-zinc-700
                  rounded-2xl
                  px-5
                  py-4
                  text-zinc-200
                  outline-none
                "
              />

              <button
                onClick={() =>
                  adicionarProduto(comanda.id)
                }
                className="
                  bg-green-500
                  hover:bg-green-600
                  rounded-2xl
                  px-8
                  py-4
                  font-bold
                "
              >
                Adicionar Produto
              </button>

            </div>

            {/* ITENS */}

            <div className="space-y-4">

              <h3 className="text-2xl font-bold">
                Itens do pedido
              </h3>

              {comanda.itens?.length > 0 ? (

                comanda.itens.map((item, index) => (

                  <div
                    key={index}
                    className="
                      bg-[#070D1A]
                      border
                      border-zinc-800
                      rounded-2xl
                      p-4
                      flex
                      justify-between
                    "
                  >

                    <p className="text-zinc-200">
                      {item.nome}
                    </p>

                    <p className="text-zinc-400">
                      {item.quantidade}x
                    </p>

                  </div>

                ))

              ) : (

                <p className="text-zinc-500">
                  Nenhum item adicionado
                </p>

              )}

            </div>

            {/* FECHAR */}

            <div className="mt-8 flex justify-end">

              <button
                onClick={() =>
                  fecharComanda(comanda.id)
                }
                className="
                  bg-red-500
                  hover:bg-red-600
                  rounded-2xl
                  px-8
                  py-4
                  font-bold
                "
              >
                Fechar
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>

  );
}