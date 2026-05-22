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

export default function Dashboard() {
  const vendas = [
    { dia: 'Seg', valor: 1200 },
    { dia: 'Ter', valor: 900 },
    { dia: 'Qua', valor: 1500 },
    { dia: 'Qui', valor: 700 },
    { dia: 'Sex', valor: 2100 },
    { dia: 'Sab', valor: 3200 },
    { dia: 'Dom', valor: 1800 },
  ];

  const pagamentos = [
    { nome: 'Dinheiro', valor: 1200 },
    { nome: 'Pix', valor: 2400 },
    { nome: 'Crédito', valor: 3200 },
    { nome: 'Débito', valor: 1800 },
  ];

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

  const totalVendas = vendas.reduce(
    (total, item) => total + item.valor,
    0
  );

  return (
    <div className="p-6 bg-zinc-900 min-h-screen text-white">
      <h1 className="text-4xl font-bold mb-8">
        Dashboard Financeiro
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-zinc-800 p-6 rounded-2xl">
          <h2 className="text-zinc-400 mb-2">
            Total Vendido
          </h2>

          <p className="text-3xl font-bold text-green-400">
            R$ {totalVendas.toFixed(2)}
          </p>
        </div>

        <div className="bg-zinc-800 p-6 rounded-2xl">
          <h2 className="text-zinc-400 mb-2">
            Quantidade de Vendas
          </h2>

          <p className="text-3xl font-bold">
            128
          </p>
        </div>

        <div className="bg-zinc-800 p-6 rounded-2xl">
          <h2 className="text-zinc-400 mb-2">
            Ticket Médio
          </h2>

          <p className="text-3xl font-bold text-blue-400">
            R$ 75.90
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-800 p-6 rounded-2xl">
          <h2 className="text-2xl font-bold mb-6">
            Vendas da Semana
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vendas}>
              <XAxis dataKey="dia" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip />

              <Bar
                dataKey="valor"
                fill="#3b82f6"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-zinc-800 p-6 rounded-2xl">
          <h2 className="text-2xl font-bold mb-6">
            Formas de Pagamento
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pagamentos}
                dataKey="valor"
                nameKey="nome"
                outerRadius={100}
                label
              >
                {pagamentos.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}