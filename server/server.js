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
      nome TEXT NOT NULL,
      preco REAL NOT NULL,
      estoque INTEGER NOT NULL
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
    ALTER TABLE comandas
    ADD COLUMN forma_pagamento TEXT
  `, (err) => {
    if (
      err &&
      !err.message.includes('duplicate column name')
    ) {
      console.log(err.message);
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS itens_comanda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comanda_id INTEGER,
      produto_id INTEGER,
      quantidade INTEGER,
      valor REAL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      usuario TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL,
      perfil TEXT NOT NULL
    )
  `);

  db.run(`
    INSERT OR IGNORE INTO usuarios (
      id,
      nome,
      usuario,
      senha,
      perfil
    )
    VALUES
    (1, 'Administrador', 'admin', '1234', 'ADMIN'),
    (2, 'Atendente', 'atendente', '1234', 'ATENDENTE')
  `);
});

app.get('/', (req, res) => {
  res.send('API ONLINE');
});

app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;

  db.get(
    `
    SELECT
      id,
      nome,
      usuario,
      perfil
    FROM usuarios
    WHERE usuario = ?
    AND senha = ?
    `,
    [usuario, senha],
    (err, user) => {
      if (err) {
        res.status(500).json(err);
        return;
      }

      if (!user) {
        res.status(401).json({
          erro: 'Usuário ou senha inválidos'
        });
        return;
      }

      res.json(user);
    }
  );
});

app.get('/produtos', (req, res) => {
  db.all(
    `
    SELECT *
    FROM produtos
    ORDER BY id DESC
    `,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json(err);
        return;
      }

      res.json(rows);
    }
  );
});

app.post('/produtos', (req, res) => {
  const { nome, preco, estoque } = req.body;

  db.run(
    `
    INSERT INTO produtos (
      nome,
      preco,
      estoque
    )
    VALUES (?, ?, ?)
    `,
    [nome, preco, estoque],
    function(err) {
      if (err) {
        res.status(500).json(err);
        return;
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
  const id = req.params.id;
  const { nome, preco, estoque } = req.body;

  db.run(
    `
    UPDATE produtos
    SET
      nome = ?,
      preco = ?,
      estoque = ?
    WHERE id = ?
    `,
    [nome, preco, estoque, id],
    function(err) {
      if (err) {
        res.status(500).json(err);
        return;
      }

      res.json({
        sucesso: true
      });
    }
  );
});

app.delete('/produtos/:id', (req, res) => {
  const id = req.params.id;

  db.run(
    `
    DELETE FROM produtos
    WHERE id = ?
    `,
    [id],
    function(err) {
      if (err) {
        res.status(500).json(err);
        return;
      }

      res.json({
        sucesso: true
      });
    }
  );
});

app.get('/comandas', (req, res) => {
  db.all(
    `
    SELECT *
    FROM comandas
    ORDER BY id DESC
    `,
    [],
    (err, comandas) => {
      if (err) {
        res.status(500).json(err);
        return;
      }

      db.all(
        `
        SELECT
          itens_comanda.comanda_id,
          produtos.nome,
          itens_comanda.quantidade
        FROM itens_comanda
        JOIN produtos
          ON produtos.id = itens_comanda.produto_id
        `,
        [],
        (err, itens) => {
          if (err) {
            res.status(500).json(err);
            return;
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
    INSERT INTO comandas (
      cliente,
      tipo,
      status
    )
    VALUES (?, ?, ?)
    `,
    [cliente, tipo, 'ABERTA'],
    function(err) {
      if (err) {
        res.status(500).json(err);
        return;
      }

      res.json({
        id: this.lastID,
        cliente,
        tipo,
        status: 'ABERTA'
      });
    }
  );
});

app.get('/comandas/:id', (req, res) => {
  const comandaId = req.params.id;

  db.all(
    `
    SELECT
      itens_comanda.id,
      produtos.nome,
      itens_comanda.quantidade,
      itens_comanda.valor
    FROM itens_comanda
    JOIN produtos
      ON produtos.id = itens_comanda.produto_id
    WHERE itens_comanda.comanda_id = ?
    `,
    [comandaId],
    (err, rows) => {
      if (err) {
        res.status(500).json(err);
        return;
      }

      res.json(rows);
    }
  );
});

app.post('/comandas/:id/itens', (req, res) => {
  const comandaId = req.params.id;
  const { produto_id, quantidade } = req.body;

  db.get(
    `
    SELECT *
    FROM produtos
    WHERE id = ?
    `,
    [produto_id],
    (err, produto) => {
      if (err || !produto) {
        res.status(404).json({
          erro: 'Produto não encontrado'
        });
        return;
      }

      const valor =
        Number(produto.preco) * Number(quantidade);

      db.run(
        `
        INSERT INTO itens_comanda (
          comanda_id,
          produto_id,
          quantidade,
          valor
        )
        VALUES (?, ?, ?, ?)
        `,
        [
          comandaId,
          produto_id,
          quantidade,
          valor
        ],
        function(err) {
          if (err) {
            res.status(500).json(err);
            return;
          }

          db.run(
            `
            UPDATE comandas
            SET total = total + ?
            WHERE id = ?
            `,
            [valor, comandaId],
            function(err) {
              if (err) {
                res.status(500).json(err);
                return;
              }

              res.json({
                sucesso: true
              });
            }
          );
        }
      );
    }
  );
});

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
      ON produtos.id = itens_comanda.produto_id
    WHERE itens_comanda.id = ?
    `,
    [itemId],
    (err, item) => {
      if (err || !item) {
        res.status(404).json({
          erro: 'Item não encontrado'
        });
        return;
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
              res.status(500).json(err);
              return;
            }

            db.run(
              `
              UPDATE comandas
              SET total = total - ?
              WHERE id = ?
              `,
              [item.valor, item.comanda_id],
              function(err) {
                if (err) {
                  res.status(500).json(err);
                  return;
                }

                res.json({
                  removido: true
                });
              }
            );
          }
        );

        return;
      }

      const novoValor =
        Number(item.preco) * Number(quantidade);

      const diferenca =
        novoValor - Number(item.valor);

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
            res.status(500).json(err);
            return;
          }

          db.run(
            `
            UPDATE comandas
            SET total = total + ?
            WHERE id = ?
            `,
            [
              diferenca,
              item.comanda_id
            ],
            function(err) {
              if (err) {
                res.status(500).json(err);
                return;
              }

              res.json({
                sucesso: true
              });
            }
          );
        }
      );
    }
  );
});

app.put('/comandas/:id/fechar', (req, res) => {
  const id = req.params.id;
  const { forma_pagamento } = req.body;

  db.run(
    `
    UPDATE comandas
    SET
      status = 'FECHADA',
      forma_pagamento = ?
    WHERE id = ?
    `,
    [forma_pagamento, id],
    function(err) {
      if (err) {
        res.status(500).json(err);
        return;
      }

      res.json({
        sucesso: true,
        forma_pagamento
      });
    }
  );
});

app.delete('/comandas/:id', (req, res) => {
  const id = req.params.id;

  db.run(
    `
    DELETE FROM itens_comanda
    WHERE comanda_id = ?
    `,
    [id],
    function(err) {
      if (err) {
        res.status(500).json(err);
        return;
      }

      db.run(
        `
        DELETE FROM comandas
        WHERE id = ?
        `,
        [id],
        function(err) {
          if (err) {
            res.status(500).json(err);
            return;
          }

          res.json({
            sucesso: true
          });
        }
      );
    }
  );
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});