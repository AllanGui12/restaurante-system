import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = 'https://restaurante-api-2.onrender.com';

export default function Caixa() {
  const [caixa, setCaixa] = useState({
    aberto: false,
    valorInicial: 0,
    dinheiroEsperado: 0,
    total: 0,
    quantidade: 0,
    pagamentos: [],
    vendas: [],
  });

  const [valorInicial, setValorInicial] = useState('');
  const [relatorio, setRelatorio] = useState([]);

  async function carregarCaixa() {
    const response = await fetch(`${API_URL}/caixa`);
    const data = await response.json();

    setCaixa({
      aberto: data.aberto || false,
      valorInicial: data.valorInicial || 0,
      dinheiroEsperado: data.dinheiroEsperado || 0,
      total: data.total || 0,
      quantidade: data.quantidade || 0,
      pagamentos: Array.isArray(data.pagamentos) ? data.pagamentos : [],
      vendas: Array.isArray(data.vendas) ? data.vendas : [],
    });
  }

  async function abrirCaixa() {
    await fetch(`${API_URL}/caixa/abrir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor_inicial: valorInicial || 0 }),
    });

    setValorInicial('');
    carregarCaixa();
  }

  async function fecharCaixa() {
    const confirmar = window.confirm(
      'Deseja realmente fechar o caixa?'
    );

    if (!confirmar) return;

    await fetch(`${API_URL}/caixa/fechar`, {
      method: 'PUT',
    });

    carregarCaixa();
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

  function gerarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Relatório de Vendas', 14, 20);

    doc.setFontSize(12);
    doc.text(`Total do Caixa: R$ ${Number(caixa.total).toFixed(2)}`, 14, 32);
    doc.text(`Vendas Fechadas: ${caixa.quantidade}`, 14, 40);
    doc.text(
      `Ticket Médio: R$ ${
        caixa.quantidade > 0
          ? Number(caixa.total / caixa.quantidade).toFixed(2)
          : '0.00'
      }`,
      14,
      48
    );

    autoTable(doc, {
      startY: 60,
      head: [['Data', 'Quantidade', 'Total']],
      body: relatorio.map((dia) => [
        new Date(dia.dia).toLocaleDateString('pt-BR', {
          timeZone: 'UTC',
        }),
        dia.quantidade,
        `R$ ${Number(dia.total || 0).toFixed(2)}`,
      ]),
    });

    doc.save('relatorio-vendas.pdf');
  }

  if (!caixa.aberto) {
    return (
      <div className="bg-[#050816] min-h-screen text-white p-10">
        <h1 className="text-5xl font-bold mb-3">Caixa</h1>

        <p className="text-zinc-400 mb-10">
          Para iniciar as vendas do dia, abra o caixa informando o valor inicial.
        </p>

        <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-8 max-w-xl">
          <h2 className="text-3xl font-bold mb-6">
            Caixa Fechado
          </h2>

          <input
            type="number"
            placeholder="Valor inicial do caixa"
            value={valorInicial}
            onChange={(e) => setValorInicial(e.target.value)}
            className="w-full bg-[#070D1A] border border-zinc-700 rounded-2xl px-5 py-4 text-white outline-none mb-6"
          />

          <button
            onClick={abrirCaixa}
            className="w-full bg-green-500 hover:bg-green-600 rounded-2xl px-8 py-4 font-bold"
          >
            Abrir Caixa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#050816] min-h-screen text-white p-10">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-5xl font-bold mb-3">Caixa</h1>

          <p className="text-zinc-400">
            Caixa aberto. As vendas serão calculadas a partir da abertura.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={gerarPDF}
            className="bg-green-500 hover:bg-green-600 rounded-2xl px-6 py-3 font-bold"
          >
            Gerar PDF
          </button>

          <button
            onClick={fecharCaixa}
            className="bg-red-500 hover:bg-red-600 rounded-2xl px-6 py-3 font-bold"
          >
            Fechar Caixa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-6">
          <p className="text-zinc-400 mb-2">Valor Inicial</p>
          <h2 className="text-4xl font-bold text-yellow-400">
            R$ {Number(caixa.valorInicial).toFixed(2)}
          </h2>
        </div>

        <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-6">
          <p className="text-zinc-400 mb-2">Total Vendido</p>
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
          <p className="text-zinc-400 mb-2">Dinheiro Esperado</p>
          <h2 className="text-4xl font-bold text-purple-400">
            R$ {Number(caixa.dinheiroEsperado).toFixed(2)}
          </h2>
        </div>
      </div>

      <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-8 mb-10">
        <h2 className="text-3xl font-bold mb-6">
          Formas de Pagamento
        </h2>

        <div className="space-y-4">
          {caixa.pagamentos.length === 0 && (
            <p className="text-zinc-500">Nenhuma venda registrada neste caixa.</p>
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

      <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-8">
        <h2 className="text-3xl font-bold mb-6">
          Vendas do Caixa Aberto
        </h2>

        <div className="space-y-4">
          {caixa.vendas.length === 0 && (
            <p className="text-zinc-500">
              Nenhuma venda registrada neste caixa.
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