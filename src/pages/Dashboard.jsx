import { useEffect, useState } from 'react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const API_URL = 'https://restaurante-api-2.onrender.com';

export default function Dashboard() {
  const [dados, setDados] = useState({
    totalVendido: 0,
    quantidadeVendas: 0,
    ticketMedio: 0,
    formasPagamento: [],
  });

  async function carregarDashboard() {
    try {
      const response = await fetch(`${API_URL}/dashboard`);
      const data = await response.json();

      setDados({
        totalVendido: data.totalVendido || 0,
        quantidadeVendas: data.quantidadeVendas || 0,
        ticketMedio: data.ticketMedio || 0,
        formasPagamento: Array.isArray(data.formasPagamento)
          ? data.formasPagamento
          : [],
      });
    } catch {
      setDados({
        totalVendido: 0,
        quantidadeVendas: 0,
        ticketMedio: 0,
        formasPagamento: [],
      });
    }
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444'];

  return (
    <div className="bg-[#050816] min-h-screen text-white p-10">
      <h1 className="text-5xl font-bold mb-3">
        Dashboard Financeiro
      </h1>

      <p className="text-zinc-400 mb-10">
        Acompanhe o desempenho financeiro das comandas fechadas
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#0B1120] border border-zinc-800 p-6 rounded-3xl">
          <h2 className="text-zinc-400 mb-2">
            Total Vendido
          </h2>

          <p className="text-4xl font-bold text-green-400">
            R$ {Number(dados.totalVendido).toFixed(2)}
          </p>
        </div>

        <div className="bg-[#0B1120] border border-zinc-800 p-6 rounded-3xl">
          <h2 className="text-zinc-400 mb-2">
            Quantidade de Vendas
          </h2>

          <p className="text-4xl font-bold text-blue-400">
            {dados.quantidadeVendas}
          </p>
        </div>

        <div className="bg-[#0B1120] border border-zinc-800 p-6 rounded-3xl">
          <h2 className="text-zinc-400 mb-2">
            Ticket Médio
          </h2>

          <p className="text-4xl font-bold text-purple-400">
            R$ {Number(dados.ticketMedio).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0B1120] border border-zinc-800 p-6 rounded-3xl">
          <h2 className="text-2xl font-bold mb-6">
            Vendas por Pagamento
          </h2>

          {dados.formasPagamento.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dados.formasPagamento}>
                <XAxis dataKey="nome" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" />
                <Tooltip />

                <Bar
                  dataKey="valor"
                  fill="#3b82f6"
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-zinc-500">
              Nenhuma venda fechada ainda.
            </p>
          )}
        </div>

        <div className="bg-[#0B1120] border border-zinc-800 p-6 rounded-3xl">
          <h2 className="text-2xl font-bold mb-6">
            Formas de Pagamento
          </h2>

          {dados.formasPagamento.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dados.formasPagamento}
                  dataKey="valor"
                  nameKey="nome"
                  outerRadius={100}
                  label
                >
                  {dados.formasPagamento.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-zinc-500">
              Nenhum pagamento registrado.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}