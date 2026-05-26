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
    CREATE TABLE IF NOT EXISTS itens_comanda (
      id SERIAL PRIMARY KEY,
      comanda_id INTEGER REFERENCES comandas(id) ON DELETE CASCADE,
      produto_id INTEGER REFERENCES produtos(id),
      quantidade INTEGER,
      valor NUMERIC(10,2)
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
      'SELECT * FROM produtos ORDER BY id DESC'
    );

    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.json([]);
  }
});

app.post('/produtos', async (req, res) => {
  try {
    const { nome, preco, estoque } = req.body;

    const result = await db.query(
      `
      INSERT INTO produtos (nome, preco, estoque)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [nome, preco, estoque]
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
    const { nome, preco, estoque } = req.body;

    await db.query(
      `
      UPDATE produtos
      SET nome = $1,
          preco = $2,
          estoque = $3
      WHERE id = $4
      `,
      [nome, preco, estoque, id]
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

    const comandas = comandasResult.rows;
    const itens = itensResult.rows;

    const resultado = comandas.map((comanda) => ({
      ...comanda,
      itens: itens.filter(
        (item) => item.comanda_id === comanda.id
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
  try {
    const { id } = req.params;
    const { forma_pagamento } = req.body;

    await db.query(
      `
      UPDATE comandas
      SET status = 'FECHADA',
          forma_pagamento = $1
      WHERE id = $2
      `,
      [forma_pagamento || 'PIX', id]
    );

    res.json({ sucesso: true });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.get('/dashboard', async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT *
      FROM comandas
      WHERE status = 'FECHADA'
      `
    );

    const comandas = result.rows;

    const totalVendido = comandas.reduce(
      (total, comanda) =>
        total + Number(comanda.total || 0),
      0
    );

    const quantidadeVendas = comandas.length;

    const ticketMedio =
      quantidadeVendas > 0
        ? totalVendido / quantidadeVendas
        : 0;

    const formasPagamento = {};

    comandas.forEach((comanda) => {
      const forma =
        comanda.forma_pagamento || 'Não informado';

      formasPagamento[forma] =
        (formasPagamento[forma] || 0) +
        Number(comanda.total || 0);
    });

    res.json({
      totalVendido,
      quantidadeVendas,
      ticketMedio,
      formasPagamento: Object.entries(formasPagamento).map(
        ([nome, valor]) => ({
          nome,
          valor,
        })
      ),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.get('/caixa', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT *
      FROM comandas
      WHERE status = 'FECHADA'
      AND DATE(data) = CURRENT_DATE
    `);

    const vendas = result.rows;

    const total = vendas.reduce(
      (acc, venda) => acc + Number(venda.total || 0),
      0
    );

    const pagamentos = {};

    vendas.forEach((venda) => {
      const forma = venda.forma_pagamento || 'Não informado';

      pagamentos[forma] =
        (pagamentos[forma] || 0) + Number(venda.total || 0);
    });

    res.json({
      total,
      quantidade: vendas.length,
      pagamentos: Object.entries(pagamentos).map(([nome, valor]) => ({
        nome,
        valor,
      })),
      vendas,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`API PostgreSQL rodando porta ${PORT}`);
});