import { useEffect, useState } from 'react';

const API_URL = 'https://restaurante-api-2.onrender.com';

export default function Caixa() {
  const [caixa, setCaixa] = useState({
    total: 0,
    quantidade: 0,
    pagamentos: [],
    vendas: [],
  });

  const [relatorio, setRelatorio] = useState([]);

  async function carregarCaixa() {
    const response = await fetch(`${API_URL}/caixa`);
    const data = await response.json();

    setCaixa({
      total: data.total || 0,
      quantidade: data.quantidade || 0,
      pagamentos: Array.isArray(data.pagamentos)
        ? data.pagamentos
        : [],
      vendas: Array.isArray(data.vendas)
        ? data.vendas
        : [],
    });
  }

  async function carregarRelatorio() {
    const response = await fetch(`${API_URL}/relatorio-vendas`);
    const data = await response.json();

    setRelatorio(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    carregarCaixa();
    carregarRelatorio();
  }, []);

  return (
    <div className="bg-[#050816] min-h-screen text-white p-10">
      <h1 className="text-5xl font-bold mb-3">Caixa</h1>

      <p className="text-zinc-400 mb-10">
        Resumo financeiro das vendas fechadas hoje
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-6">
          <p className="text-zinc-400 mb-2">Total do Dia</p>
          <h2 className="text-4xl font-bold text-green-400">
            R$ {Number(caixa.total).toFixed(2)}
          </h2>
        </div>

        <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-6">
          <p className="text-zinc-400 mb-2">Vendas Fechadas</p>
          <h2 className="text-4xl font-bold text-blue-400">
            {caixa.quantidade}
          </h2>
        </div>

        <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-6">
          <p className="text-zinc-400 mb-2">Ticket Médio</p>
          <h2 className="text-4xl font-bold text-purple-400">
            R${' '}
            {caixa.quantidade > 0
              ? Number(caixa.total / caixa.quantidade).toFixed(2)
              : '0.00'}
          </h2>
        </div>
      </div>

      <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-8 mb-10">
        <h2 className="text-3xl font-bold mb-6">
          Formas de Pagamento
        </h2>

        <div className="space-y-4">
          {caixa.pagamentos.length === 0 && (
            <p className="text-zinc-500">Nenhuma venda hoje.</p>
          )}

          {caixa.pagamentos.map((pagamento) => (
            <div
              key={pagamento.nome}
              className="bg-[#070D1A] border border-zinc-800 rounded-2xl p-4 flex justify-between"
            >
              <span className="font-bold">{pagamento.nome}</span>

              <span className="text-green-400 font-bold">
                R$ {Number(pagamento.valor).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-8 mb-10">
        <h2 className="text-3xl font-bold mb-6">
          Relatório Dia x Dia
        </h2>

        <div className="space-y-4">
          {relatorio.length === 0 && (
            <p className="text-zinc-500">Nenhum relatório encontrado.</p>
          )}

          {relatorio.map((dia) => (
            <div
              key={dia.dia}
              className="bg-[#070D1A] border border-zinc-800 rounded-2xl p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-bold">
                  {new Date(dia.dia).toLocaleDateString('pt-BR')}
                </p>

                <p className="text-zinc-400">
                  {dia.quantidade} venda(s)
                </p>
              </div>

              <p className="text-green-400 font-bold text-xl">
                R$ {Number(dia.total || 0).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-8">
        <h2 className="text-3xl font-bold mb-6">
          Vendas de Hoje
        </h2>

        <div className="space-y-4">
          {caixa.vendas.length === 0 && (
            <p className="text-zinc-500">
              Nenhuma venda registrada hoje.
            </p>
          )}

          {caixa.vendas.map((venda) => (
            <div
              key={venda.id}
              className="bg-[#070D1A] border border-zinc-800 rounded-2xl p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-bold">{venda.cliente}</p>
                <p className="text-zinc-400">
                  {venda.forma_pagamento || 'Não informado'}
                </p>
              </div>

              <p className="text-green-400 font-bold text-xl">
                R$ {Number(venda.total || 0).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}