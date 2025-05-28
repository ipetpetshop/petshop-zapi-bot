require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔧 Iniciando aplicação...');
console.log('🌍 PORT configurada:', PORT);
console.log('🔑 ZAPI_INSTANCE_ID presente:', !!process.env.ZAPI_INSTANCE_ID);
console.log('🔑 ZAPI_TOKEN presente:', !!process.env.ZAPI_TOKEN);

// Validação das variáveis .env essenciais
if (!process.env.ZAPI_INSTANCE_ID || !process.env.ZAPI_TOKEN) {
  console.error('❌ Variáveis ZAPI_INSTANCE_ID ou ZAPI_TOKEN não estão definidas no .env');
  console.error('📋 Variáveis encontradas:', Object.keys(process.env).filter(key => key.startsWith('ZAPI')));
  process.exit(1);
}

// Middlewares
app.use(cors());               // Libera acesso CORS (útil para dashboards externos)
app.use(express.json({ limit: '10mb' }));       // Permite receber JSON no corpo
app.use(morgan('dev'));        // Log básico de requisições no console

// Importar router após validação das env vars
let router;
try {
  router = require('./router');
  console.log('✅ Router carregado com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar router:', error.message);
  process.exit(1);
}

// Rotas
app.use('/', router);

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('🔥 Erro não tratado:', error);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: error.message 
  });
});

// Rota 404 para rotas não encontradas
app.use('*', (req, res) => {
  console.log('⚠️ Rota não encontrada:', req.method, req.originalUrl);
  res.status(404).json({ 
    error: 'Rota não encontrada',
    method: req.method,
    path: req.originalUrl 
  });
});

// Inicialização do servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Bot rodando na porta ${PORT}`);
  console.log(`🌐 Servidor ativo em todas as interfaces (0.0.0.0:${PORT})`);
  console.log(`🔗 Endpoint local: http://localhost:${PORT}/`);
  console.log('✅ Servidor inicializado com sucesso!');
});

// Tratamento de encerramento graceful
server.on('error', (error) => {
  console.error('❌ Erro no servidor:', error);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`🚫 Porta ${PORT} já está em uso`);
  } else if (error.code === 'EACCES') {
    console.error(`🚫 Sem permissão para usar a porta ${PORT}`);
  }
  
  process.exit(1);
});

// Captura erros globais não tratados em promessas
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise);
  console.error('🧨 Reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🔥 Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Recebido SIGTERM. Encerrando servidor graciosamente...');
  server.close(() => {
    console.log('✅ Servidor encerrado.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 Recebido SIGINT. Encerrando servidor graciosamente...');
  server.close(() => {
    console.log('✅ Servidor encerrado.');
    process.exit(0);
  });
});
