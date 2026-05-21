import { useEffect, useState } from 'react';

export default function Produtos() {

  const [produtos, setProdutos] = useState([]);

  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [estoque, setEstoque] = useState('');

  const [produtoEditando, setProdutoEditando] =
    useState(null);

  async function carregarProdutos() {

    const response = await fetch(
      'https://restaurante-api-2.onrender.com/produtos'
    );

    const data = await response.json();

    setProdutos(data);
  }

  async function cadastrarProduto(e) {

    e.preventDefault();

    // EDITAR PRODUTO
    if (produtoEditando) {

      await fetch(
        `https://restaurante-api-2.onrender.com/produtos/${produtoEditando}`,
        {
          method: 'PUT',
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

    } else {

      // CADASTRAR PRODUTO
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
    }

    limparFormulario();

    carregarProdutos();
  }

  function editarProduto(produto) {

    setProdutoEditando(produto.id);

    setNome(produto.nome);
    setPreco(produto.preco);
    setEstoque(produto.estoque);
  }

  function limparFormulario() {

    setProdutoEditando(null);

    setNome('');
    setPreco('');
    setEstoque('');
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
    <div>

      <h1 className="text-4xl font-bold mb-8">
        Produtos
      </h1>

      <div className="bg-white p-6 rounded-3xl shadow">

        <form
          onSubmit={cadastrarProduto}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >

          <input
            type="text"
            placeholder="Nome do produto"
            value={nome}
            onChange={(e) =>
              setNome(e.target.value)
            }
            className="border rounded-2xl px-4 py-3"
            required
          />

          <input
            type="number"
            step="0.01"
            placeholder="Preço"
            value={preco}
            onChange={(e) =>
              setPreco(e.target.value)
            }
            className="border rounded-2xl px-4 py-3"
            required
          />

          <input
            type="number"
            placeholder="Estoque"
            value={estoque}
            onChange={(e) =>
              setEstoque(e.target.value)
            }
            className="border rounded-2xl px-4 py-3"
            required
          />

          <button className="bg-green-600 text-white rounded-2xl px-4 py-3 hover:bg-green-700">

            {produtoEditando
              ? 'Salvar Alteração'
              : 'Cadastrar'}

          </button>

        </form>

        {produtoEditando && (

          <button
            onClick={limparFormulario}
            className="mb-8 bg-gray-300 px-4 py-2 rounded-xl hover:bg-gray-400"
          >
            Cancelar edição
          </button>

        )}

        <div className="space-y-4">

          {produtos.map((produto) => (

            <div
              key={produto.id}
              className="border rounded-2xl p-5 flex items-center justify-between"
            >

              <div>

                <h2 className="text-xl font-semibold">
                  {produto.nome}
                </h2>

                <p className="text-gray-500">
                  Estoque: {produto.estoque}
                </p>

              </div>

              <div className="text-right">

                <div className="text-2xl font-bold text-green-600 mb-3">
                  R$ {produto.preco}
                </div>

                <div className="flex gap-2">

                  <button
                    onClick={() =>
                      editarProduto(produto)
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() =>
                      excluirProduto(produto.id)
                    }
                    className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700"
                  >
                    Excluir
                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}