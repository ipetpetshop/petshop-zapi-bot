require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const router = require('./router');

const app = express();
const PORT = process.env.PORT || 3000;

// Validação das variáveis .env essenciais
if (!process.env.ZAPI_INSTANCE_ID || !process.env.ZAPI_TOKEN) {
  console.error('❌ Variáveis ZAPI_INSTANCE_ID ou ZAPI_TOKEN não estão definidas no .env');
  process.exit(1);
}

// Middlewares
app.use(cors());               // Libera acesso CORS (útil para dashboards externos)
app.use(express.json());       // Permite receber JSON no corpo
app.use(morgan('dev'));        // Log básico de requisições no console

// Rotas
app.use('/', router);

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`🚀 Bot rodando na porta ${PORT}`);
  console.log(`🌐 Endpoint ativo: http://localhost:${PORT}/`);
});

// Captura erros globais não tratados em promessas
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise);
  console.error('🧨 Reason:', reason);
});
