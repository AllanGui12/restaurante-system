import { useEffect, useState } from 'react';

const API_URL = 'https://restaurante-api-2.onrender.com';

export default function Comandas() {
  const [comandas, setComandas] = useState([]);
  const [produtos, setProdutos] = useState([]);

  const [cliente, setCliente] = useState('');
  const [tipo, setTipo] = useState('SALAO');

  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [quantidade, setQuantidade] = useState(1);

  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const [comandaParaFechar, setComandaParaFechar] = useState(null);

  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [valorPagamento, setValorPagamento] = useState('');
  const [pagamentos, setPagamentos] = useState([]);

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

  function abrirModalPagamento(id) {
  setComandaParaFechar(id);
  setModalPagamentoAberto(true);
  setFormaPagamento('PIX');
  setValorPagamento('');
  setPagamentos([]);
}

function adicionarPagamento() {
  if (!valorPagamento || Number(valorPagamento) <= 0) return;

  setPagamentos([
    ...pagamentos,
    {
      forma_pagamento: formaPagamento,
      valor: Number(valorPagamento),
    },
  ]);

  setValorPagamento('');
}

function removerPagamento(index) {
  setPagamentos(
    pagamentos.filter((_, i) => i !== index)
  );
}

async function fecharComanda() {
  if (!comandaParaFechar) return;

  const comanda = comandas.find(
    (c) => c.id === comandaParaFechar
  );

  const total = Number(comanda?.total || 0);

  const totalPago = pagamentos.reduce(
    (acc, pagamento) => acc + Number(pagamento.valor),
    0
  );

  if (Number(totalPago.toFixed(2)) !== Number(total.toFixed(2))) {
    alert('A soma dos pagamentos precisa ser igual ao total da comanda.');
    return;
  }

  await fetch(`${API_URL}/comandas/${comandaParaFechar}/fechar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pagamentos,
    }),
  });

  setModalPagamentoAberto(false);
  setComandaParaFechar(null);
  setPagamentos([]);
  setValorPagamento('');

  carregarComandas();
}

async function excluirComanda(id) {
  const confirmar = window.confirm(
    'Deseja excluir esta comanda do histórico?'
  );

  if (!confirmar) return;

  await fetch(`${API_URL}/comandas/${id}`, {
    method: 'DELETE',
  });

  carregarComandas();
}

async function excluirComanda(id) {
  const confirmar = window.confirm(
    'Deseja excluir esta comanda do histórico?'
  );

  if (!confirmar) return;

  await fetch(`${API_URL}/comandas/${id}`, {
    method: 'DELETE',
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
  onClick={() => abrirModalPagamento(comanda.id)}
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
              <div className="text-zinc-400">
  <p>Pagamento:</p>

  {comanda.pagamentos?.length > 0 ? (
    comanda.pagamentos.map((pagamento) => (
      <p key={pagamento.id}>
        {pagamento.forma_pagamento} - R$ {Number(pagamento.valor).toFixed(2)}
      </p>
    ))
  ) : (
    <p>{comanda.forma_pagamento || 'Não informado'}</p>
  )}
</div>
              <p className="text-blue-400 font-bold">{comanda.status}</p>

<div className="mt-4 space-y-2">
  <p className="font-bold text-zinc-300">
    Itens do pedido:
  </p>

  {comanda.itens?.length > 0 ? (
    comanda.itens.map((item) => (
      <div
        key={item.id}
        className="bg-[#070D1A] border border-zinc-800 rounded-xl p-3 flex justify-between"
      >
        <span>{item.nome}</span>

        <span className="text-zinc-400">
          {item.quantidade}x
        </span>
      </div>
    ))
  ) : (
    <p className="text-zinc-500">
      Nenhum item registrado
    </p>
  )}
</div>

            </div>

           <div className="flex flex-col items-end gap-3">
  <p className="text-3xl font-bold text-green-400">
    R$ {Number(comanda.total || 0).toFixed(2)}
  </p>

  <button
    onClick={() => excluirComanda(comanda.id)}
    className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl font-bold"
  >
    Excluir
  </button>
</div>
          </div>
        ))}
      </div>

{modalPagamentoAberto && (() => {
  const comanda = comandas.find(
    (c) => c.id === comandaParaFechar
  );

  const total = Number(comanda?.total || 0);

  const totalPago = pagamentos.reduce(
    (acc, pagamento) => acc + Number(pagamento.valor),
    0
  );

  const restante = total - totalPago;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-8 w-full max-w-lg">
        <h2 className="text-3xl font-bold mb-4">
          Fechar Comanda
        </h2>

        <p className="text-zinc-400 mb-2">
          Total: R$ {total.toFixed(2)}
        </p>

        <p className="text-green-400 font-bold mb-6">
          Restante: R$ {restante.toFixed(2)}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <select
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value)}
            className="bg-[#070D1A] border border-zinc-700 rounded-xl px-4 py-3 text-white"
          >
            <option value="PIX">PIX</option>
            <option value="CREDITO">Crédito</option>
            <option value="DEBITO">Débito</option>
            <option value="DINHEIRO">Dinheiro</option>
          </select>

          <input
            type="number"
            placeholder="Valor"
            value={valorPagamento}
            onChange={(e) => setValorPagamento(e.target.value)}
            className="bg-[#070D1A] border border-zinc-700 rounded-xl px-4 py-3 text-white"
          />
        </div>

        <button
          onClick={adicionarPagamento}
          className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-bold mb-6"
        >
          Adicionar Pagamento
        </button>

        <div className="space-y-3 mb-6">
          {pagamentos.map((pagamento, index) => (
            <div
              key={index}
              className="bg-[#070D1A] border border-zinc-800 rounded-xl p-3 flex justify-between items-center"
            >
              <span>{pagamento.forma_pagamento}</span>

              <div className="flex items-center gap-3">
                <span className="text-green-400 font-bold">
                  R$ {Number(pagamento.valor).toFixed(2)}
                </span>

                <button
                  onClick={() => removerPagamento(index)}
                  className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg font-bold"
                >
                  X
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={fecharComanda}
          className="w-full bg-green-500 hover:bg-green-600 rounded-xl py-4 font-bold mb-3"
        >
          Fechar Comanda
        </button>

        <button
          onClick={() => {
            setModalPagamentoAberto(false);
            setComandaParaFechar(null);
            setPagamentos([]);
            setValorPagamento('');
          }}
          className="w-full bg-red-500 hover:bg-red-600 rounded-xl py-4 font-bold"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
})()}
    </div>
  );
}