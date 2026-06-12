import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const app = express();

app.use(cors());
app.use(express.json());

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function criarTabelas() {
  await db.query(`
  CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome TEXT,
    preco NUMERIC(10,2),
    custo NUMERIC(10,2) DEFAULT 0,
    estoque INTEGER DEFAULT 0
  )
`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS comandas (
      id SERIAL PRIMARY KEY,
      cliente TEXT,
      tipo TEXT,
      status TEXT,
      total NUMERIC(10,2) DEFAULT 0,
      forma_pagamento TEXT,
      data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
  CREATE TABLE IF NOT EXISTS caixas (
    id SERIAL PRIMARY KEY,
    valor_inicial NUMERIC(10,2) DEFAULT 0,
    status TEXT DEFAULT 'ABERTO',
    data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_fechamento TIMESTAMP
  )
`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS itens_comanda (
      id SERIAL PRIMARY KEY,
      comanda_id INTEGER REFERENCES comandas(id) ON DELETE CASCADE,
      produto_id INTEGER REFERENCES produtos(id),
      quantidade INTEGER,
      valor NUMERIC(10,2)
    )
  `);

  await db.query(`
  ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS custo NUMERIC(10,2) DEFAULT 0
`);

await db.query(`
  CREATE TABLE IF NOT EXISTS configuracoes (
    id SERIAL PRIMARY KEY,
    nome_restaurante TEXT,
    telefone TEXT,
    endereco TEXT,
    cnpj TEXT,
    estoque_minimo INTEGER DEFAULT 5
  )
`);

await db.query(`
  INSERT INTO configuracoes (id, nome_restaurante, telefone, endereco, cnpj, estoque_minimo)
  VALUES (1, '', '', '', '', 5)
  ON CONFLICT (id) DO NOTHING
`);

await db.query(`
  CREATE TABLE IF NOT EXISTS pagamentos_comanda (
    id SERIAL PRIMARY KEY,
    comanda_id INTEGER REFERENCES comandas(id) ON DELETE CASCADE,
    forma_pagamento TEXT,
    valor NUMERIC(10,2),
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
}

criarTabelas();

app.get('/', (req, res) => {
  res.send('API ONLINE POSTGRESQL');
});

app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario === 'admin' && senha === '1234') {
    return res.json({ nome: 'Administrador', perfil: 'ADMIN' });
  }

  if (usuario === 'atendente' && senha === '1234') {
    return res.json({ nome: 'Atendente', perfil: 'ATENDENTE' });
  }

  res.status(401).json({ erro: 'Usuário ou senha inválidos' });
});

app.get('/produtos', async (req, res) => {
  try {
    const result = await db.query(
  'SELECT * FROM produtos ORDER BY nome ASC'
);

    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.json([]);
  }
});

app.post('/produtos', async (req, res) => {
  try {
    const { nome, preco, custo, estoque } = req.body;

    const result = await db.query(
      `
      INSERT INTO produtos (nome, preco, custo, estoque)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [nome, preco, custo || 0, estoque]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.put('/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, preco, custo, estoque } = req.body;

    await db.query(
      `
      UPDATE produtos
      SET nome = $1,
          preco = $2,
          custo = $3,
          estoque = $4
      WHERE id = $5
      `,
      [nome, preco, custo || 0, estoque, id]
    );

    res.json({ sucesso: true });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.delete('/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'DELETE FROM produtos WHERE id = $1',
      [id]
    );

    res.json({ sucesso: true });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.get('/comandas', async (req, res) => {
  try {
    const comandasResult = await db.query(
      'SELECT * FROM comandas ORDER BY id DESC'
    );

    const itensResult = await db.query(`
      
      SELECT
        itens_comanda.id,
        itens_comanda.comanda_id,
        itens_comanda.produto_id,
        produtos.nome,
        itens_comanda.quantidade,
        itens_comanda.valor
      FROM itens_comanda
      JOIN produtos
        ON produtos.id = itens_comanda.produto_id
    `);

    const pagamentosResult = await db.query(`
  SELECT *
  FROM pagamentos_comanda
`);

    const comandas = comandasResult.rows;
    const itens = itensResult.rows;
    const pagamentos = pagamentosResult.rows;

    const resultado = comandas.map((comanda) => ({
  ...comanda,

  itens: itens.filter(
    (item) => item.comanda_id === comanda.id
  ),

  pagamentos: pagamentos.filter(
    (pagamento) => pagamento.comanda_id === comanda.id
  ),
}));

    res.json(resultado);
  } catch (err) {
    console.log(err);
    res.json([]);
  }
});

app.post('/comandas', async (req, res) => {
  try {
    const { cliente, tipo } = req.body;

    const result = await db.query(
      `
      INSERT INTO comandas (cliente, tipo, status, total)
      VALUES ($1, $2, 'ABERTA', 0)
      RETURNING *
      `,
      [cliente, tipo]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

async function atualizarTotalComanda(comandaId) {
  const result = await db.query(
    `
    SELECT
      itens_comanda.quantidade,
      produtos.preco
    FROM itens_comanda
    JOIN produtos
      ON produtos.id = itens_comanda.produto_id
    WHERE itens_comanda.comanda_id = $1
    `,
    [comandaId]
  );

  const total = result.rows.reduce(
    (acc, item) =>
      acc + Number(item.quantidade) * Number(item.preco),
    0
  );

  await db.query(
    `
    UPDATE comandas
    SET total = $1
    WHERE id = $2
    `,
    [total, comandaId]
  );
}

app.post('/comandas/:id/itens', async (req, res) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const comandaId = req.params.id;
    const { produto_id, quantidade } = req.body;
    const qtd = Number(quantidade);

    const produtoResult = await client.query(
      'SELECT * FROM produtos WHERE id = $1',
      [produto_id]
    );

    const produto = produtoResult.rows[0];

    if (!produto) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    if (Number(produto.estoque) < qtd) {
      await client.query('ROLLBACK');
      return res.status(400).json({ erro: 'Estoque insuficiente' });
    }

    const itemResult = await client.query(
      `
      SELECT *
      FROM itens_comanda
      WHERE comanda_id = $1
      AND produto_id = $2
      `,
      [comandaId, produto_id]
    );

    const itemExistente = itemResult.rows[0];

    if (itemExistente) {
      const novaQuantidade =
        Number(itemExistente.quantidade) + qtd;

      const novoValor =
        Number(produto.preco) * novaQuantidade;

      await client.query(
        `
        UPDATE itens_comanda
        SET quantidade = $1,
            valor = $2
        WHERE id = $3
        `,
        [novaQuantidade, novoValor, itemExistente.id]
      );
    } else {
      const valor = Number(produto.preco) * qtd;

      await client.query(
        `
        INSERT INTO itens_comanda (
          comanda_id,
          produto_id,
          quantidade,
          valor
        )
        VALUES ($1, $2, $3, $4)
        `,
        [comandaId, produto_id, qtd, valor]
      );
    }

    await client.query(
      `
      UPDATE produtos
      SET estoque = estoque - $1
      WHERE id = $2
      `,
      [qtd, produto_id]
    );

    await client.query('COMMIT');

    await atualizarTotalComanda(comandaId);

    res.json({ sucesso: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.log(err);
    res.status(500).json(err);
  } finally {
    client.release();
  }
});

app.put('/itens/:id', async (req, res) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const itemId = req.params.id;
    const novaQuantidade = Number(req.body.quantidade);

    const itemResult = await client.query(
      `
      SELECT
        itens_comanda.*,
        produtos.preco,
        produtos.estoque
      FROM itens_comanda
      JOIN produtos
        ON produtos.id = itens_comanda.produto_id
      WHERE itens_comanda.id = $1
      `,
      [itemId]
    );

    const item = itemResult.rows[0];

    if (!item) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'Item não encontrado' });
    }

    const quantidadeAtual = Number(item.quantidade);
    const diferenca = novaQuantidade - quantidadeAtual;

    if (diferenca > 0 && Number(item.estoque) < diferenca) {
      await client.query('ROLLBACK');
      return res.status(400).json({ erro: 'Estoque insuficiente' });
    }

    if (novaQuantidade <= 0) {
      await client.query(
        'DELETE FROM itens_comanda WHERE id = $1',
        [itemId]
      );

      await client.query(
        `
        UPDATE produtos
        SET estoque = estoque + $1
        WHERE id = $2
        `,
        [quantidadeAtual, item.produto_id]
      );
    } else {
      const novoValor =
        Number(item.preco) * novaQuantidade;

      await client.query(
        `
        UPDATE itens_comanda
        SET quantidade = $1,
            valor = $2
        WHERE id = $3
        `,
        [novaQuantidade, novoValor, itemId]
      );

      await client.query(
        `
        UPDATE produtos
        SET estoque = estoque - $1
        WHERE id = $2
        `,
        [diferenca, item.produto_id]
      );
    }

    await client.query('COMMIT');

    await atualizarTotalComanda(item.comanda_id);

    res.json({ sucesso: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.log(err);
    res.status(500).json(err);
  } finally {
    client.release();
  }
});

app.put('/comandas/:id/fechar', async (req, res) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { forma_pagamento, pagamentos } = req.body;

    const comandaResult = await client.query(
      'SELECT * FROM comandas WHERE id = $1',
      [id]
    );

    const comanda = comandaResult.rows[0];

    if (!comanda) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        erro: 'Comanda não encontrada',
      });
    }

    await client.query(
      'DELETE FROM pagamentos_comanda WHERE comanda_id = $1',
      [id]
    );

    if (Array.isArray(pagamentos) && pagamentos.length > 0) {
      const totalPagamentos = pagamentos.reduce(
        (acc, pagamento) => acc + Number(pagamento.valor || 0),
        0
      );

      if (Number(totalPagamentos.toFixed(2)) !== Number(comanda.total)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          erro: 'A soma dos pagamentos precisa ser igual ao total da comanda',
        });
      }

      for (const pagamento of pagamentos) {
        await client.query(
          `
          INSERT INTO pagamentos_comanda (
            comanda_id,
            forma_pagamento,
            valor
          )
          VALUES ($1, $2, $3)
          `,
          [id, pagamento.forma_pagamento, pagamento.valor]
        );
      }

      const formaFinal =
  pagamentos.length === 1
    ? pagamentos[0].forma_pagamento
    : 'DIVIDIDO';

await client.query(
  `
  UPDATE comandas
  SET status = 'FECHADA',
      forma_pagamento = $1
  WHERE id = $2
  `,
  [formaFinal, id]
);
    } else {
      await client.query(
        `
        INSERT INTO pagamentos_comanda (
          comanda_id,
          forma_pagamento,
          valor
        )
        VALUES ($1, $2, $3)
        `,
        [id, forma_pagamento || 'PIX', comanda.total]
      );

      await client.query(
        `
        UPDATE comandas
        SET status = 'FECHADA',
            forma_pagamento = $1
        WHERE id = $2
        `,
        [forma_pagamento || 'PIX', id]
      );
    }

    await client.query('COMMIT');

    res.json({ sucesso: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.log(err);
    res.status(500).json(err);
  } finally {
    client.release();
  }
});

app.get('/dashboard', async (req, res) => {
  try {
    const comandasResult = await db.query(`
      SELECT *
      FROM comandas
      WHERE status = 'FECHADA'
    `);

    const pagamentosResult = await db.query(`
      SELECT
        forma_pagamento AS nome,
        SUM(valor) AS valor
      FROM pagamentos_comanda
      WHERE forma_pagamento IN ('PIX', 'DINHEIRO', 'CREDITO', 'DEBITO')
      GROUP BY forma_pagamento
      ORDER BY forma_pagamento
    `);

    const comandas = comandasResult.rows;

    const totalVendido = comandas.reduce(
      (total, comanda) => total + Number(comanda.total || 0),
      0
    );

    const quantidadeVendas = comandas.length;

    const ticketMedio =
      quantidadeVendas > 0 ? totalVendido / quantidadeVendas : 0;

    res.json({
      totalVendido,
      quantidadeVendas,
      ticketMedio,
      formasPagamento: pagamentosResult.rows,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.post('/caixa/abrir', async (req, res) => {
  try {
    const { valor_inicial } = req.body;

    const aberto = await db.query(`
      SELECT *
      FROM caixas
      WHERE status = 'ABERTO'
      LIMIT 1
    `);

    if (aberto.rows.length > 0) {
      return res.status(400).json({
        erro: 'Já existe um caixa aberto',
      });
    }

    const result = await db.query(
      `
      INSERT INTO caixas (valor_inicial, status)
      VALUES ($1, 'ABERTO')
      RETURNING *
      `,
      [valor_inicial || 0]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.put('/caixa/fechar', async (req, res) => {
  try {
    const result = await db.query(`
      UPDATE caixas
      SET status = 'FECHADO',
          data_fechamento = CURRENT_TIMESTAMP
      WHERE status = 'ABERTO'
      RETURNING *
    `);

    if (result.rows.length === 0) {
      return res.status(400).json({
        erro: 'Não existe caixa aberto',
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.get('/caixa', async (req, res) => {
  try {
    const caixaResult = await db.query(`
      SELECT *
      FROM caixas
      WHERE status = 'ABERTO'
      ORDER BY id DESC
      LIMIT 1
    `);

    const caixaAberto = caixaResult.rows[0];

    if (!caixaAberto) {
      return res.json({
        aberto: false,
        total: 0,
        quantidade: 0,
        pagamentos: [],
        vendas: [],
        valorInicial: 0,
        dinheiroEsperado: 0,
      });
    }

    const vendasResult = await db.query(
      `
      SELECT *
      FROM comandas
      WHERE status = 'FECHADA'
      AND data >= $1
      ORDER BY data DESC
      `,
      [caixaAberto.data_abertura]
    );

    const pagamentosResult = await db.query(
      `
      SELECT
        pagamentos_comanda.forma_pagamento AS nome,
        SUM(pagamentos_comanda.valor) AS valor
      FROM pagamentos_comanda
      JOIN comandas
        ON comandas.id = pagamentos_comanda.comanda_id
      WHERE comandas.status = 'FECHADA'
      AND comandas.data >= $1
      GROUP BY pagamentos_comanda.forma_pagamento
      `,
      [caixaAberto.data_abertura]
    );

    const vendas = vendasResult.rows;

    const pagamentosVendasResult = await db.query(
  `
  SELECT
    pagamentos_comanda.id,
    pagamentos_comanda.comanda_id,
    pagamentos_comanda.forma_pagamento,
    pagamentos_comanda.valor
  FROM pagamentos_comanda
  JOIN comandas
    ON comandas.id = pagamentos_comanda.comanda_id
  WHERE comandas.status = 'FECHADA'
  AND comandas.data >= $1
  `,
  [caixaAberto.data_abertura]
);

const pagamentosVendas = pagamentosVendasResult.rows;

const vendasComPagamentos = vendas.map((venda) => ({
  ...venda,
  pagamentos: pagamentosVendas.filter(
    (pagamento) => pagamento.comanda_id === venda.id
  ),
}));

    const total = vendas.reduce(
      (acc, venda) => acc + Number(venda.total || 0),
      0
    );

    const dinheiro = pagamentosResult.rows.find(
      (p) => p.nome === 'DINHEIRO'
    );

    const dinheiroEsperado =
      Number(caixaAberto.valor_inicial || 0) +
      Number(dinheiro?.valor || 0);

    res.json({
      aberto: true,
      caixa: caixaAberto,
      valorInicial: Number(caixaAberto.valor_inicial || 0),
      total,
      quantidade: vendas.length,
      pagamentos: pagamentosResult.rows,
      dinheiroEsperado,
      vendas: vendasComPagamentos,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.get('/relatorio-vendas', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        DATE(data AT TIME ZONE 'America/Sao_Paulo') AS dia,
        COUNT(*) AS quantidade,
        SUM(total) AS total
      FROM comandas
      WHERE status = 'FECHADA'
      GROUP BY DATE(data AT TIME ZONE 'America/Sao_Paulo')
      ORDER BY dia DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.delete('/comandas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'DELETE FROM comandas WHERE id = $1',
      [id]
    );

    res.json({ sucesso: true });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.get('/configuracoes', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM configuracoes WHERE id = 1'
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.put('/configuracoes', async (req, res) => {
  try {
    const {
      nome_restaurante,
      telefone,
      endereco,
      cnpj,
      estoque_minimo
    } = req.body;

    const result = await db.query(
      `
      UPDATE configuracoes
      SET nome_restaurante = $1,
          telefone = $2,
          endereco = $3,
          cnpj = $4,
          estoque_minimo = $5
      WHERE id = 1
      RETURNING *
      `,
      [
        nome_restaurante,
        telefone,
        endereco,
        cnpj,
        estoque_minimo || 5
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.get('/caixas/historico', async (req, res) => {
  try {
    const caixasResult = await db.query(`
      SELECT *
      FROM caixas
      WHERE status = 'FECHADO'
      ORDER BY data_fechamento DESC
    `);

    const caixas = [];

    for (const caixa of caixasResult.rows) {
      const vendasResult = await db.query(
        `
        SELECT *
        FROM comandas
        WHERE status = 'FECHADA'
        AND data >= $1
        AND data <= $2
        `,
        [caixa.data_abertura, caixa.data_fechamento]
      );

      const pagamentosResult = await db.query(
        `
        SELECT
          pagamentos_comanda.forma_pagamento AS nome,
          SUM(pagamentos_comanda.valor) AS valor
        FROM pagamentos_comanda
        JOIN comandas
          ON comandas.id = pagamentos_comanda.comanda_id
        WHERE comandas.status = 'FECHADA'
        AND comandas.data >= $1
        AND comandas.data <= $2
        GROUP BY pagamentos_comanda.forma_pagamento
        `,
        [caixa.data_abertura, caixa.data_fechamento]
      );

      const totalVendido = vendasResult.rows.reduce(
        (acc, venda) => acc + Number(venda.total || 0),
        0
      );

      caixas.push({
        ...caixa,
        totalVendido,
        quantidadeVendas: vendasResult.rows.length,
        pagamentos: pagamentosResult.rows,
      });
    }

    res.json(caixas);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`API PostgreSQL rodando porta ${PORT}`);
});