import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';

const app = express();

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./restaurante.db');


// ==========================
// TESTE API
// ==========================

app.get('/', (req, res) => {
  res.send('API ONLINE');
});

app.get('/teste-api', (req, res) => {
  res.send('TESTE API FUNCIONANDO');
});


// ==========================
// LOGIN
// ==========================

app.post('/login', (req, res) => {

  const { usuario, senha } = req.body;

  if (
    usuario === 'administrador' &&
    senha === '1234'
  ) {

    return res.json({
      nome: 'Administrador',
      perfil: 'ADMIN'
    });
  }

  if (
    usuario === 'atendente' &&
    senha === '1234'
  ) {

    return res.json({
      nome: 'Atendente',
      perfil: 'ATENDENTE'
    });
  }

  return res.status(401).json({
    erro: 'Usuário ou senha inválidos'
  });

});


// ==========================
// PRODUTOS
// ==========================

app.get('/produtos', (req, res) => {

  db.all(
    'SELECT * FROM produtos',
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
    estoque
  } = req.body;

  db.run(
    `
      INSERT INTO produtos
      (nome, preco, estoque)
      VALUES (?, ?, ?)
    `,
    [nome, preco, estoque],

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

app.delete('/produtos/:id', (req, res) => {

  db.run(
    'DELETE FROM produtos WHERE id = ?',
    [req.params.id],

    function(err) {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        sucesso: true
      });

    }
  );

});


// ==========================
// COMANDAS
// ==========================

app.get('/comandas', (req, res) => {

  db.all(
    'SELECT * FROM comandas',
    [],
    async (err, comandas) => {

      if (err) {
        return res.status(500).json(err);
      }

      const resultado = await Promise.all(

        comandas.map((comanda) => {

          return new Promise((resolve) => {

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
                  ON produtos.id =
                  itens_comanda.produto_id

                WHERE itens_comanda.comanda_id = ?
              `,
              [comanda.id],

              (errItens, itens) => {

                resolve({
                  ...comanda,
                  itens
                });

              }
            );

          });

        })

      );

      res.json(resultado);

    }
  );

});

app.post('/comandas', (req, res) => {

  const {
    cliente,
    tipo
  } = req.body;

  db.run(
    `
      INSERT INTO comandas
      (cliente, tipo, status, total)

      VALUES (?, ?, ?, ?)
    `,
    [cliente, tipo, 'ABERTA', 0],

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


// ==========================
// ADICIONAR ITEM
// ==========================

app.post('/comandas/:id/itens', (req, res) => {

  const comandaId = req.params.id;

  const {
    produto_id,
    quantidade
  } = req.body;

  db.get(
    `
      SELECT *
      FROM produtos
      WHERE id = ?
    `,
    [produto_id],

    (err, produto) => {

      if (err || !produto) {
        return res.status(500).json(err);
      }

      const valor =
        produto.preco * quantidade;

      db.get(
        `
          SELECT *
          FROM itens_comanda
          WHERE comanda_id = ?
          AND produto_id = ?
        `,
        [comandaId, produto_id],

        (errBusca, itemExistente) => {

          if (itemExistente) {

            const novaQuantidade =
              itemExistente.quantidade +
              Number(quantidade);

            db.run(
              `
                UPDATE itens_comanda
                SET quantidade = ?,
                    valor = ?
                WHERE id = ?
              `,
              [
                novaQuantidade,
                produto.preco * novaQuantidade,
                itemExistente.id
              ]
            );

          } else {

            db.run(
              `
                INSERT INTO itens_comanda
                (
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
              ]
            );

          }

          db.run(
            `
              UPDATE comandas

              SET total =
                total + ?

              WHERE id = ?
            `,
            [valor, comandaId]
          );

          res.json({
            sucesso: true
          });

        }
      );

    }
  );

});


// ==========================
// ATUALIZAR QUANTIDADE
// ==========================

app.put('/itens/:id', (req, res) => {

  const itemId = req.params.id;

  const { quantidade } = req.body;

  db.get(
    `
      SELECT itens_comanda.*,
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
        return res.status(500).json(err);
      }

      if (quantidade <= 0) {

        db.run(
          `
            DELETE FROM itens_comanda
            WHERE id = ?
          `,
          [itemId]
        );

        db.run(
          `
            UPDATE comandas
            SET total = total - ?
            WHERE id = ?
          `,
          [
            item.valor,
            item.comanda_id
          ]
        );

        return res.json({
          sucesso: true
        });

      }

      const novoValor =
        item.preco * quantidade;

      const diferenca =
        novoValor - item.valor;

      db.run(
        `
          UPDATE itens_comanda

          SET quantidade = ?,
              valor = ?

          WHERE id = ?
        `,
        [
          quantidade,
          novoValor,
          itemId
        ]
      );

      db.run(
        `
          UPDATE comandas

          SET total = total + ?

          WHERE id = ?
        `,
        [
          diferenca,
          item.comanda_id
        ]
      );

      res.json({
        sucesso: true
      });

    }
  );

});


// ==========================
// FECHAR COMANDA
// ==========================

app.put('/comandas/:id/fechar', (req, res) => {

  db.run(
    `
      UPDATE comandas
      SET status = 'FECHADA'
      WHERE id = ?
    `,
    [req.params.id],

    function(err) {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        sucesso: true
      });

    }
  );

});


// ==========================

const PORT =
  process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(
    `API NOVA rodando porta ${PORT}`
  );
});