import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';

const app = express();

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./restaurant.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      preco REAL,
      estoque INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS comandas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente TEXT,
      tipo TEXT,
      status TEXT,
      total REAL DEFAULT 0,
      forma_pagamento TEXT,
      data DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS itens_comanda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comanda_id INTEGER,
      produto_id INTEGER,
      quantidade INTEGER,
      valor REAL
    )
  `);

  db.run(`ALTER TABLE produtos ADD COLUMN estoque INTEGER DEFAULT 0`, () => {});
  db.run(`ALTER TABLE comandas ADD COLUMN forma_pagamento TEXT`, () => {});
});

app.get('/', (req, res) => {
  res.send('API ONLINE');
});

app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario === 'admin' && senha === '1234') {
    return res.json({
      nome: 'Administrador',
      perfil: 'ADMIN'
    });
  }

  if (usuario === 'atendente' && senha === '1234') {
    return res.json({
      nome: 'Atendente',
      perfil: 'ATENDENTE'
    });
  }

  res.status(401).json({
    erro: 'Usuário ou senha inválidos'
  });
});

app.get('/produtos', (req, res) => {
  db.all(
    `SELECT * FROM produtos ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.log(err);
        return res.json([]);
      }

      res.json(rows);
    }
  );
});

app.post('/produtos', (req, res) => {
  const { nome, preco, estoque } = req.body;

  db.run(
    `
    INSERT INTO produtos (nome, preco, estoque)
    VALUES (?, ?, ?)
    `,
    [nome, preco, estoque],
    function (err) {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      res.json({
        id: this.lastID,
        nome,
        preco,
        estoque
      });
    }
  );
});

app.put('/produtos/:id', (req, res) => {
  const { id } = req.params;
  const { nome, preco, estoque } = req.body;

  db.run(
    `
    UPDATE produtos
    SET nome = ?, preco = ?, estoque = ?
    WHERE id = ?
    `,
    [nome, preco, estoque, id],
    function (err) {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      res.json({ sucesso: true });
    }
  );
});

app.delete('/produtos/:id', (req, res) => {
  const { id } = req.params;

  db.run(
    `DELETE FROM produtos WHERE id = ?`,
    [id],
    function (err) {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      res.json({ sucesso: true });
    }
  );
});

app.get('/comandas', (req, res) => {
  db.all(
    `SELECT * FROM comandas ORDER BY id DESC`,
    [],
    (err, comandas) => {
      if (err) {
        console.log(err);
        return res.json([]);
      }

      db.all(
        `
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
        `,
        [],
        (errItens, itens) => {
          if (errItens) {
            console.log(errItens);
            return res.json(
              comandas.map((comanda) => ({
                ...comanda,
                itens: []
              }))
            );
          }

          const resultado = comandas.map((comanda) => ({
            ...comanda,
            itens: itens.filter(
              (item) => item.comanda_id === comanda.id
            )
          }));

          res.json(resultado);
        }
      );
    }
  );
});

app.post('/comandas', (req, res) => {
  const { cliente, tipo } = req.body;

  db.run(
    `
    INSERT INTO comandas (cliente, tipo, status, total)
    VALUES (?, ?, 'ABERTA', 0)
    `,
    [cliente, tipo],
    function (err) {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      res.json({
        id: this.lastID,
        cliente,
        tipo,
        status: 'ABERTA',
        total: 0
      });
    }
  );
});

app.post('/comandas/:id/itens', (req, res) => {
  const comandaId = req.params.id;
  const { produto_id, quantidade } = req.body;

  db.get(
    `SELECT * FROM produtos WHERE id = ?`,
    [produto_id],
    (err, produto) => {
      if (err || !produto) {
        return res.status(404).json({
          erro: 'Produto não encontrado'
        });
      }

      const valor = Number(produto.preco) * Number(quantidade);

      db.run(
        `
        INSERT INTO itens_comanda
        (comanda_id, produto_id, quantidade, valor)
        VALUES (?, ?, ?, ?)
        `,
        [comandaId, produto_id, quantidade, valor],
        function (err) {
          if (err) {
            console.log(err);
            return res.status(500).json(err);
          }

          db.run(
            `
            UPDATE comandas
            SET total = total + ?
            WHERE id = ?
            `,
            [valor, comandaId],
            function (err) {
              if (err) {
                console.log(err);
                return res.status(500).json(err);
              }

              res.json({ sucesso: true });
            }
          );
        }
      );
    }
  );
});

app.put('/comandas/:id/fechar', (req, res) => {
  const { id } = req.params;
  const { forma_pagamento } = req.body;

  db.run(
    `
    UPDATE comandas
    SET status = 'FECHADA',
        forma_pagamento = ?
    WHERE id = ?
    `,
    [forma_pagamento || 'PIX', id],
    function (err) {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      res.json({ sucesso: true });
    }
  );
});

function atualizarTotalComanda(comandaId, res) {

  db.all(
    `
    SELECT
      itens_comanda.quantidade,
      produtos.preco

    FROM itens_comanda

    JOIN produtos
      ON produtos.id =
      itens_comanda.produto_id

    WHERE itens_comanda.comanda_id = ?
    `,
    [comandaId],

    (err, itens) => {

      if (err) {
        return res.status(500).json(err);
      }

      const total = itens.reduce(
        (acc, item) => {

          return (
            acc +
            (
              Number(item.quantidade) *
              Number(item.preco)
            )
          );

        },
        0
      );

      db.run(
        `
        UPDATE comandas

        SET total = ?

        WHERE id = ?
        `,
        [
          total,
          comandaId
        ],

        function(err) {

          if (err) {
            return res.status(500).json(err);
          }

          res.json({
            sucesso: true
          });

        }
      );

    }
  );

}

app.put('/itens/:id', (req, res) => {

  const itemId = req.params.id;

  const { quantidade } = req.body;

  db.get(
    `
    SELECT
      itens_comanda.*,
      produtos.preco

    FROM itens_comanda

    JOIN produtos
      ON produtos.id =
      itens_comanda.produto_id

    WHERE itens_comanda.id = ?
    `,
    [itemId],

    (err, item) => {

      if (err || !item) {

        return res.status(404).json({
          erro: 'Item não encontrado'
        });

      }

      if (quantidade <= 0) {

        db.run(
          `
          DELETE FROM itens_comanda
          WHERE id = ?
          `,
          [itemId],

          function(err) {

            if (err) {
              return res.status(500).json(err);
            }

            atualizarTotalComanda(
              item.comanda_id,
              res
            );

          }
        );

        return;

      }

      const novoValor =
        Number(item.preco) *
        Number(quantidade);

      db.run(
        `
        UPDATE itens_comanda

        SET
          quantidade = ?,
          valor = ?

        WHERE id = ?
        `,
        [
          quantidade,
          novoValor,
          itemId
        ],

        function(err) {

          if (err) {
            return res.status(500).json(err);
          }

          atualizarTotalComanda(
            item.comanda_id,
            res
          );

        }
      );

    }
  );

});

app.get('/dashboard', (req, res) => {
  db.all(
    `
    SELECT *
    FROM comandas
    WHERE status = 'FECHADA'
    `,
    [],
    (err, comandas) => {
      if (err) {
        return res.status(500).json(err);
      }

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
    }
  );
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`API rodando porta ${PORT}`);
});