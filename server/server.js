const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./restaurant.db');

db.serialize(() => {

  // =========================
  // TABELA PRODUTOS
  // =========================

  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      preco REAL,
      categoria TEXT
    )
  `);

  // =========================
  // TABELA COMANDAS
  // =========================

  db.run(`
    CREATE TABLE IF NOT EXISTS comandas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente TEXT,
      tipo TEXT,
      status TEXT,
      total REAL DEFAULT 0,
      pagamento TEXT
    )
  `);

  // =========================
  // ITENS DA COMANDA
  // =========================

  db.run(`
    CREATE TABLE IF NOT EXISTS comanda_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comanda_id INTEGER,
      produto_id INTEGER,
      quantidade INTEGER,
      nome TEXT,
      preco REAL
    )
  `);

  // =========================
  // USUÁRIOS
  // =========================

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      usuario TEXT,
      senha TEXT,
      perfil TEXT
    )
  `);

  // ADMIN
  db.get(
    `SELECT * FROM usuarios WHERE usuario = ?`,
    ['admin'],
    (err, row) => {
      if (!row) {
        db.run(`
          INSERT INTO usuarios
          (nome, usuario, senha, perfil)
          VALUES
          ('Administrador', 'admin', '1234', 'ADMIN')
        `);
      }
    }
  );

  // ATENDENTE
  db.get(
    `SELECT * FROM usuarios WHERE usuario = ?`,
    ['atendente'],
    (err, row) => {
      if (!row) {
        db.run(`
          INSERT INTO usuarios
          (nome, usuario, senha, perfil)
          VALUES
          ('Atendente', 'atendente', '1234', 'ATENDENTE')
        `);
      }
    }
  );
});


// ======================================
// LOGIN
// ======================================

app.post('/login', (req, res) => {

  const { usuario, senha } = req.body;

  db.get(
    `
      SELECT *
      FROM usuarios
      WHERE usuario = ?
      AND senha = ?
    `,
    [usuario, senha],
    (err, row) => {

      if (err) {
        return res.status(500).json(err);
      }

      if (!row) {
        return res.status(401).json({
          erro: 'Usuário inválido'
        });
      }

      res.json(row);
    }
  );
});


// ======================================
// PRODUTOS
// ======================================

app.get('/produtos', (req, res) => {

  db.all(
    `SELECT * FROM produtos ORDER BY id DESC`,
    [],
    (err, rows) => {

      if (err) {
        return res.status(500).json(err);
      }

      res.json(rows);
    }
  );
});

app.post('/produtos', (req, res) => {

  const {
    nome,
    preco,
    categoria
  } = req.body;

  db.run(
    `
      INSERT INTO produtos
      (nome, preco, categoria)
      VALUES (?, ?, ?)
    `,
    [nome, preco, categoria],
    function(err) {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        id: this.lastID
      });
    }
  );
});

app.put('/produtos/:id', (req, res) => {

  const { id } = req.params;

  const {
    nome,
    preco,
    categoria
  } = req.body;

  db.run(
    `
      UPDATE produtos
      SET
        nome = ?,
        preco = ?,
        categoria = ?
      WHERE id = ?
    `,
    [nome, preco, categoria, id],
    function(err) {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        atualizado: true
      });
    }
  );
});

app.delete('/produtos/:id', (req, res) => {

  const { id } = req.params;

  db.run(
    `DELETE FROM produtos WHERE id = ?`,
    [id],
    function(err) {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        deletado: true
      });
    }
  );
});


// ======================================
// COMANDAS
// ======================================

app.get('/comandas', (req, res) => {

  db.all(`
    SELECT * FROM comandas
    ORDER BY id DESC
  `, [], (err, rows) => {

    if (err) {
      return res.status(500).json(err);
    }

    res.json(rows);
  });
});

app.post('/comandas', (req, res) => {

  const {
    cliente,
    tipo
  } = req.body;

  db.run(
    `
      INSERT INTO comandas
      (cliente, tipo, status)
      VALUES (?, ?, ?)
    `,
    [cliente, tipo, 'ABERTA'],
    function(err) {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        id: this.lastID
      });
    }
  );
});

app.put('/comandas/:id/fechar', (req, res) => {

  const { id } = req.params;

  const { pagamento } = req.body;

  db.run(
    `
      UPDATE comandas
      SET
        status = 'FINALIZADA',
        pagamento = ?
      WHERE id = ?
    `,
    [pagamento, id],
    function(err) {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        fechado: true
      });
    }
  );
});

app.delete('/comandas/:id', (req, res) => {

  const { id } = req.params;

  db.run(
    `DELETE FROM comandas WHERE id = ?`,
    [id],
    function(err) {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        deletado: true
      });
    }
  );
});


// ======================================
// ITENS COMANDA
// ======================================

app.get('/comandas/:id/itens', (req, res) => {

  const { id } = req.params;

  db.all(
    `
      SELECT *
      FROM comanda_itens
      WHERE comanda_id = ?
    `,
    [id],
    (err, rows) => {

      if (err) {
        return res.status(500).json(err);
      }

      res.json(rows);
    }
  );
});

app.post('/comandas/:id/itens', (req, res) => {

  const { id } = req.params;

  const {
    produto_id,
    quantidade,
    nome,
    preco
  } = req.body;

  db.run(
    `
      INSERT INTO comanda_itens
      (
        comanda_id,
        produto_id,
        quantidade,
        nome,
        preco
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      id,
      produto_id,
      quantidade,
      nome,
      preco
    ],
    function(err) {

      if (err) {
        return res.status(500).json(err);
      }

      atualizarTotal(id);

      res.json({
        criado: true
      });
    }
  );
});


// ======================================
// ATUALIZAR TOTAL
// ======================================

function atualizarTotal(comandaId) {

  db.all(
    `
      SELECT *
      FROM comanda_itens
      WHERE comanda_id = ?
    `,
    [comandaId],
    (err, itens) => {

      let total = 0;

      itens.forEach((item) => {
        total += item.preco * item.quantidade;
      });

      db.run(
        `
          UPDATE comandas
          SET total = ?
          WHERE id = ?
        `,
        [total, comandaId]
      );
    }
  );
}


// ======================================

app.get('/', (req, res) => {
  res.send('API ONLINE');
});


// ======================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});