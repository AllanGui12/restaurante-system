import { useEffect, useState } from 'react';

export default function Comandas() {
  const [comandas, setComandas] = useState([]);

  const [cliente, setCliente] = useState('');
  const [tipo, setTipo] = useState('SALAO');

  const [comandaAberta, setComandaAberta] =
    useState(null);

  const [produtos, setProdutos] = useState([]);
  const [itens, setItens] = useState([]);

  const [produtoId, setProdutoId] =
    useState('');

  const [quantidade, setQuantidade] =
    useState(1);

  const [formaPagamento, setFormaPagamento] =
    useState('PIX');

  const [comandaPagamento, setComandaPagamento] =
    useState(null);

  async function carregarComandas() {
    const response = await fetch(
      'https://restaurante-api-dftr.onrender.com/comandas'
    );

    const data = await response.json();

    setComandas(data);
  }

  async function carregarProdutos() {
    const response = await fetch(
      'https://restaurante-api-dftr.onrender.com/produtos'
    );

    const data = await response.json();

    setProdutos(data);
  }

  async function carregarItens(comandaId) {
    const response = await fetch(
      `https://restaurante-api-dftr.onrender.com/comandas/${comandaId}`
    );

    const data = await response.json();

    setItens(data);
  }

  async function abrirComanda(e) {
    e.preventDefault();

    await fetch(
      'https://restaurante-api-dftr.onrender.com/comandas',
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
    setTipo('SALAO');

    await carregarComandas();
  }

  async function abrirDetalhes(comandaId) {
    if (comandaAberta === comandaId) {
      setComandaAberta(null);
      return;
    }

    setComandaAberta(comandaId);

    await carregarItens(comandaId);
  }

  async function adicionarItem(e) {
    e.preventDefault();

    await fetch(
      `https://restaurante-api-dftr.onrender.com/comandas/${comandaAberta}/itens`,
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

    setProdutoId('');
    setQuantidade(1);

    await carregarComandas();
    await carregarItens(comandaAberta);
  }

  async function atualizarQuantidade(
    itemId,
    novaQuantidade
  ) {
    await fetch(
      `https://restaurante-api-dftr.onrender.com/itens/${itemId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantidade: novaQuantidade,
        }),
      }
    );

    await carregarComandas();
    await carregarItens(comandaAberta);
  }

  async function confirmarPagamento() {
    console.log(
      'Forma selecionada:',
      formaPagamento
    );

    const response = await fetch(
      `https://restaurante-api-dftr.onrender.com/comandas/${comandaPagamento}/fechar`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          forma_pagamento: formaPagamento,
        }),
      }
    );

    const data = await response.json();

    console.log(data);

    setComandaPagamento(null);
    setComandaAberta(null);

    await carregarComandas();
  }

  async function excluirHistorico(id) {
    const confirmar = window.confirm(
      'Deseja excluir esta comanda?'
    );

    if (!confirmar) return;

    await fetch(
      `https://restaurante-api-dftr.onrender.com/comandas/${id}`,
      {
        method: 'DELETE',
      }
    );

    await carregarComandas();
  }

  useEffect(() => {
    carregarComandas();
    carregarProdutos();
  }, []);

  const comandasAbertas =
    comandas.filter(
      (comanda) =>
        comanda.status === 'ABERTA'
    );

  const historico =
    comandas.filter(
      (comanda) =>
        comanda.status === 'FECHADA'
    );

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">
        Comandas
      </h1>

      <div className="bg-white p-6 rounded-3xl shadow">
        <form
          onSubmit={abrirComanda}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
        >
          <input
            type="text"
            placeholder="Nome do cliente"
            value={cliente}
            onChange={(e) =>
              setCliente(e.target.value)
            }
            className="border rounded-2xl px-4 py-3"
            required
          />

          <select
            value={tipo}
            onChange={(e) =>
              setTipo(e.target.value)
            }
            className="border rounded-2xl px-4 py-3"
          >
            <option value="SALAO">
              Salão
            </option>

            <option value="DELIVERY">
              Delivery
            </option>

            <option value="RETIRADA">
              Retirada
            </option>
          </select>

          <button className="bg-blue-600 text-white rounded-2xl px-4 py-3 hover:bg-blue-700">
            Abrir Comanda
          </button>
        </form>

        <h2 className="text-2xl font-bold mb-5">
          Comandas Abertas
        </h2>

        <div className="space-y-4 mb-10">
          {comandasAbertas.map((comanda) => (
            <div
              key={comanda.id}
              className="border rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <button
                    onClick={() =>
                      abrirDetalhes(comanda.id)
                    }
                    className="text-2xl font-bold text-blue-600"
                  >
                    {comanda.cliente}
                  </button>

                  <p className="text-gray-500 mt-1">
                    Tipo: {comanda.tipo}
                  </p>

                  <p className="text-gray-500">
                    Status: {comanda.status}
                  </p>

                  <div className="mt-3 text-sm text-gray-700">
                    <p className="font-bold">
                      Itens do pedido:
                    </p>

                    {comanda.itens &&
                    comanda.itens.length > 0 ? (
                      <ul className="list-disc ml-5">
                        {comanda.itens.map(
                          (item, index) => (
                            <li key={index}>
                              {item.quantidade}x{' '}
                              {item.nome}
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className="text-gray-400">
                        Nenhum item adicionado
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    R$ {Number(comanda.total).toFixed(2)}
                  </p>

                  <button
                    onClick={() =>
                      setComandaPagamento(comanda.id)
                    }
                    className="bg-red-600 text-white px-4 py-2 rounded-xl mt-3 hover:bg-red-700"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              {comandaAberta === comanda.id && (
                <div className="mt-6 border-t pt-6">
                  <form
                    onSubmit={adicionarItem}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
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
                      Adicionar Produto
                    </button>
                  </form>

                  <div className="space-y-3">
                    {itens.map((item) => (
                      <div
                        key={item.id}
                        className="bg-gray-100 rounded-2xl p-4 flex justify-between"
                      >
                        <div>
                          <h3 className="font-bold">
                            {item.nome}
                          </h3>

                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() =>
                                atualizarQuantidade(
                                  item.id,
                                  item.quantidade - 1
                                )
                              }
                              className="bg-red-500 text-white w-8 h-8 rounded-lg"
                            >
                              -
                            </button>

                            <span className="font-bold text-lg">
                              {item.quantidade}
                            </span>

                            <button
                              onClick={() =>
                                atualizarQuantidade(
                                  item.id,
                                  item.quantidade + 1
                                )
                              }
                              className="bg-green-600 text-white w-8 h-8 rounded-lg"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="font-bold text-green-600">
                          R$ {Number(item.valor).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-5">
          Histórico
        </h2>

        <div className="space-y-4">
          {historico.map((comanda) => (
            <div
              key={comanda.id}
              className="border rounded-2xl p-5 flex items-center justify-between bg-gray-100"
            >
              <div>
                <h2 className="text-2xl font-bold">
                  {comanda.cliente}
                </h2>

                <p className="text-gray-500 mt-1">
                  Tipo: {comanda.tipo}
                </p>

                <p className="text-gray-500">
                  Pagamento:{' '}
                  {comanda.forma_pagamento || 'Não informado'}
                </p>

                <div className="mt-3 text-sm text-gray-700">
                  <p className="font-bold">
                    Itens do pedido:
                  </p>

                  {comanda.itens &&
                  comanda.itens.length > 0 ? (
                    <ul className="list-disc ml-5">
                      {comanda.itens.map(
                        (item, index) => (
                          <li key={index}>
                            {item.quantidade}x{' '}
                            {item.nome}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="text-gray-400">
                      Nenhum item adicionado
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-gray-700">
                  R$ {Number(comanda.total).toFixed(2)}
                </p>

                <p className="text-sm text-gray-500 mt-2 mb-3">
                  FINALIZADA
                </p>

                <button
                  onClick={() =>
                    excluirHistorico(comanda.id)
                  }
                  className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {comandaPagamento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-[400px]">
            <h2 className="text-3xl font-bold mb-6">
              Fechamento
            </h2>

            <select
              value={formaPagamento}
              onChange={(e) =>
                setFormaPagamento(e.target.value)
              }
              className="w-full border rounded-2xl px-4 py-3 mb-6"
            >
              <option value="PIX">
                PIX
              </option>

              <option value="CREDITO">
                Crédito
              </option>

              <option value="DEBITO">
                Débito
              </option>

              <option value="DINHEIRO">
                Dinheiro
              </option>
            </select>

            <div className="flex gap-4">
              <button
                onClick={() =>
                  setComandaPagamento(null)
                }
                className="flex-1 bg-gray-300 rounded-2xl py-3"
              >
                Cancelar
              </button>

              <button
                onClick={confirmarPagamento}
                className="flex-1 bg-green-600 text-white rounded-2xl py-3"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}