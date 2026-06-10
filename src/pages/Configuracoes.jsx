import { useEffect, useState } from 'react';

import {
  Settings,
  Database,
  CloudUpload,
  Store,
  Package,
  Users,
  Info,
  Server,
  Save,
  RotateCcw
} from 'lucide-react';

const API_URL = 'https://restaurante-api-2.onrender.com';

export default function Configuracoes() {
  const [config, setConfig] = useState({
    nome_restaurante: '',
    telefone: '',
    endereco: '',
    cnpj: '',
    estoque_minimo: 5,
  });

  async function carregarConfiguracoes() {
    const response = await fetch(`${API_URL}/configuracoes`);
    const data = await response.json();

    setConfig({
      nome_restaurante: data.nome_restaurante || '',
      telefone: data.telefone || '',
      endereco: data.endereco || '',
      cnpj: data.cnpj || '',
      estoque_minimo: data.estoque_minimo || 5,
    });
  }

  async function salvarConfiguracoes() {
    await fetch(`${API_URL}/configuracoes`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    alert('Configurações salvas com sucesso!');
    carregarConfiguracoes();
  }

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  return (
    <div className="bg-[#050816] min-h-screen text-white p-10">
      <div className="flex items-center gap-4 mb-10">
        <Settings size={48} className="text-zinc-300" />

        <div>
          <h1 className="text-5xl font-bold">
            Configurações do Sistema
          </h1>

          <p className="text-zinc-400 mt-2">
            Gerencie as configurações gerais do sistema
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Server className="text-blue-500" />
            <h2 className="text-2xl font-bold">
              Informações do Sistema
            </h2>
          </div>

          <div className="space-y-5">
            <div className="flex justify-between border-b border-zinc-800 pb-3">
              <span className="text-zinc-400">Versão do Sistema</span>
              <span className="font-bold">1.0.0</span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-3">
              <span className="text-zinc-400">Banco de Dados</span>
              <span className="font-bold text-green-400">
                PostgreSQL conectado
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-3">
              <span className="text-zinc-400">Servidor</span>
              <span className="font-bold text-green-400">Online</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Último acesso</span>
              <span className="font-bold">
                {new Date().toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <CloudUpload className="text-green-500" />
            <h2 className="text-2xl font-bold">Backup</h2>
          </div>

          <div className="space-y-5">
            <div className="flex justify-between border-b border-zinc-800 pb-3">
              <span className="text-zinc-400">Último Backup</span>
              <span className="text-green-400 font-bold">A configurar</span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-3">
              <span className="text-zinc-400">Próximo Backup</span>
              <span className="text-green-400 font-bold">A configurar</span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-3">
              <span className="text-zinc-400">Local</span>
              <span className="font-bold text-zinc-300">
                C:\SistemaRestaurante\Backups
              </span>
            </div>

            <div className="flex gap-3 pt-3">
              <button className="bg-green-500 hover:bg-green-600 rounded-xl px-4 py-3 font-bold flex-1 flex items-center justify-center gap-2">
                <CloudUpload size={18} />
                Fazer Backup
              </button>

              <button className="bg-blue-600 hover:bg-blue-700 rounded-xl px-4 py-3 font-bold flex-1 flex items-center justify-center gap-2">
                <RotateCcw size={18} />
                Restaurar
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Store className="text-purple-500" />
            <h2 className="text-2xl font-bold">
              Dados do Restaurante
            </h2>
          </div>

          <div className="space-y-4">
            <input
              placeholder="Nome do restaurante"
              value={config.nome_restaurante}
              onChange={(e) =>
                setConfig({ ...config, nome_restaurante: e.target.value })
              }
              className="w-full bg-[#070D1A] border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none"
            />

            <input
              placeholder="Telefone"
              value={config.telefone}
              onChange={(e) =>
                setConfig({ ...config, telefone: e.target.value })
              }
              className="w-full bg-[#070D1A] border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none"
            />

            <input
              placeholder="Endereço"
              value={config.endereco}
              onChange={(e) =>
                setConfig({ ...config, endereco: e.target.value })
              }
              className="w-full bg-[#070D1A] border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none"
            />

            <input
              placeholder="CNPJ"
              value={config.cnpj}
              onChange={(e) =>
                setConfig({ ...config, cnpj: e.target.value })
              }
              className="w-full bg-[#070D1A] border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none"
            />

            <button
              onClick={salvarConfiguracoes}
              className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl py-3 font-bold flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Salvar Alterações
            </button>
          </div>
        </div>

        <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Package className="text-yellow-500" />
            <h2 className="text-2xl font-bold">
              Controle de Estoque
            </h2>
          </div>

          <p className="text-zinc-400 mb-4">
            Defina a quantidade mínima para alerta de estoque baixo.
          </p>

          <input
            type="number"
            placeholder="Quantidade mínima"
            value={config.estoque_minimo}
            onChange={(e) =>
              setConfig({ ...config, estoque_minimo: e.target.value })
            }
            className="w-full bg-[#070D1A] border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none mb-4"
          />

          <button
            onClick={salvarConfiguracoes}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl py-3 font-bold"
          >
            Salvar Estoque Mínimo
          </button>
        </div>

        <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-blue-500" />
            <h2 className="text-2xl font-bold">
              Usuários do Sistema
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between border-b border-zinc-800 pb-3">
              <span>Administrador</span>
              <span className="bg-green-600 px-3 py-1 rounded-full text-sm">
                Admin
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-3">
              <span>Atendente</span>
              <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                Atendente
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#0B1120] border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Database className="text-green-500" />
            <h2 className="text-2xl font-bold">
              Banco de Dados
            </h2>
          </div>

          <div className="space-y-5">
            <div className="flex justify-between">
              <span className="text-zinc-400">Banco</span>
              <span className="font-bold">PostgreSQL</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Produtos</span>
              <span className="font-bold">--</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Comandas</span>
              <span className="font-bold">--</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Vendas Totais</span>
              <span className="font-bold text-green-400">--</span>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 bg-[#0B1120] border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Info className="text-purple-500" />
            <h2 className="text-2xl font-bold">
              Sobre o Sistema
            </h2>
          </div>

          <p className="text-zinc-400">
            Sistema desenvolvido para gestão completa de restaurantes.
          </p>

          <p className="mt-3">
            Desenvolvedor: <strong>Allan Guimarães</strong>
          </p>

          <p>
            Versão atual: <strong>1.0.0</strong>
          </p>
        </div>
      </div>
    </div>
  );
}