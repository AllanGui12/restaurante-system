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
  const [historicoCaixas, setHistoricoCaixas] = useState([]);

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

  async function carregarHistoricoCaixas() {
    const response = await fetch(`${API_URL}/caixas/historico`);
    const data = await response.json();

    setHistoricoCaixas(Array.isArray(data) ? data : []);
  }

  async function abrirCaixa() {
    await fetch(`${API_URL}/caixa/abrir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor_inicial: valorInicial || 0 }),
    });

    setValorInicial('');
    carregarCaixa();
    carregarHistoricoCaixas();
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
    carregarHistoricoCaixas();
  }

  async function carregarRelatorio() {
    const response = await fetch(`${API_URL}/relatorio-vendas`);
    const data = await response.json();

    setRelatorio(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    carregarCaixa();
    carregarRelatorio();
    carregarHistoricoCaixas();
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

  function formatarData(data) {
    if (!data) return '-';

    return new Date(data).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    });
  }

  function HistoricoCaixas() {
    return (
      <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-8 mt-10">
        <h2 className="text-3xl font-bold mb-6">
          Histórico de Caixas
        </h2>

        <div className="space-y-6">
          {historicoCaixas.length === 0 && (
            <p className="text-zinc-500">
              Nenhum caixa fechado encontrado.
            </p>
          )}

          {historicoCaixas.map((item) => {
            const dinheiro = item.pagamentos?.find(
              (p) => p.nome === 'DINHEIRO'
            );

            const dinheiroEsperado =
              Number(item.valor_inicial || 0) +
              Number(dinheiro?.valor || 0);

            return (
              <div
                key={item.id}
                className="bg-[#070D1A] border border-zinc-800 rounded-2xl p-5"
              >
                <div className="flex justify-between items-start gap-6 mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">
                      Caixa #{item.id}
                    </h3>

                    <p className="text-zinc-400 mt-2">
                      Abertura: {formatarData(item.data_abertura)}
                    </p>

                    <p className="text-zinc-400">
                      Fechamento: {formatarData(item.data_fechamento)}
                    </p>

                    <p className="text-zinc-400">
                      Vendas: {item.quantidadeVendas}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-zinc-400">
                      Valor Inicial
                    </p>

                    <p className="text-yellow-400 text-xl font-bold mb-3">
                      R$ {Number(item.valor_inicial || 0).toFixed(2)}
                    </p>

                    <p className="text-zinc-400">
                      Total Vendido
                    </p>

                    <p className="text-green-400 text-2xl font-bold">
                      R$ {Number(item.totalVendido || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {item.pagamentos?.map((pagamento) => (
                    <div
                      key={pagamento.nome}
                      className="bg-[#0B1120] border border-zinc-800 rounded-xl p-3 flex justify-between"
                    >
                      <span>{pagamento.nome}</span>

                      <span className="text-green-400 font-bold">
                        R$ {Number(pagamento.valor || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 bg-[#0B1120] border border-zinc-800 rounded-xl p-3 flex justify-between">
                  <span className="font-bold">
                    Dinheiro esperado na gaveta
                  </span>

                  <span className="text-purple-400 font-bold">
                    R$ {dinheiroEsperado.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
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

        <HistoricoCaixas />
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

      <HistoricoCaixas />
    </div>
  );
}