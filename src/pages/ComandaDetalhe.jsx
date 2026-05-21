import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function ComandaDetalhe() {

  const { id } = useParams();

  const [produtos, setProdutos] = useState([]);
  const [itens, setItens] = useState([]);

  const [produtoId, setProdutoId] = useState('');
  const [quantidade, setQuantidade] = useState(1);

  async function carregarProdutos() {

    const response = await fetch(
      'https://restaurante-api-dftr.onrender.com/produtos'
    );

    const data = await response.json();

    setProdutos(data);
  }

  async function carregarItens() {

    const response = await fetch(
      `https://restaurante-api-dftr.onrender.com/comandas/${id}`
    );

    const data = await response.json();

    setItens(data);
  }

  async function adicionarItem(e) {

    e.preventDefault();

    await fetch(
      `https://restaurante-api-dftr.onrender.com/comandas/${id}/itens`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          produto_id: produtoId,
          quantidade,
        }),
      }
    );

    carregarItens();
  }

  useEffect(() => {

    carregarProdutos();
    carregarItens();

  }, []);

  const total = itens.reduce(
    (acc, item) => acc + item.valor,
    0
  );

  return (
    <div>

      <h1 className="text-4xl font-bold mb-8">
        Comanda #{id}
      </h1>

      <div className="bg-white p-6 rounded-3xl shadow">

        <form
          onSubmit={adicionarItem}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
        >

          <select
            value={produtoId}
            onChange={(e) =>
              setProdutoId(e.target.value)
            }
            className="border rounded-2xl px-4 py-3"
            required
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
            className="border rounded-2xl px-4 py-3"
            min="1"
          />

          <button className="bg-green-600 text-white rounded-2xl px-4 py-3 hover:bg-green-700">
            Adicionar
          </button>

        </form>

        <div className="space-y-4">

          {itens.map((item) => (

            <div
              key={item.id}
              className="border rounded-2xl p-5 flex items-center justify-between"
            >

              <div>

                <h2 className="text-xl font-bold">
                  {item.nome}
                </h2>

                <p className="text-gray-500">
                  Quantidade: {item.quantidade}
                </p>

              </div>

              <div className="text-xl font-bold text-green-600">
                R$ {item.valor}
              </div>

            </div>

          ))}

        </div>

        <div className="mt-10 text-right">

          <h2 className="text-3xl font-bold">
            Total: R$ {total}
          </h2>

        </div>

      </div>

    </div>
  );
}