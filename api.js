import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API ONLINE - NOVA');
});

app.get('/teste-api', (req, res) => {
  res.send('TESTE API FUNCIONANDO');
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

  return res.status(401).json({
    erro: 'Usuário inválido'
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API NOVA rodando na porta ${PORT}`);
});