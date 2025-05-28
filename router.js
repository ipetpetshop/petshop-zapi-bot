// router.js
const express = require('express');
const axios = require('axios');
const departments = require('./departments');

const router = express.Router();
const ZAPI_URL = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}`;

// Lista de DDDs brasileiros conhecidos
const validDDDs = [
  '11','12','13','14','15','16','17','18','19',
  '21','22','24','27','28',
  '31','32','33','34','35','37','38',
  '41','42','43','44','45','46',
  '47','48','49','51','53','54','55',
  '61','62','63','64','65','66','67','68','69',
  '71','73','74','75','77','79','81','82','83','84','85','86','87','88','89','91','92','93','94','95','96','97','98','99'
];

// Formata número para padrão internacional E.164 (Brasil e Portugal no exemplo)
function formatPhoneNumber(phone) {
  const numericPhone = phone.replace(/\D/g, '');

  if (numericPhone.startsWith('351') || numericPhone.startsWith('55')) {
    return numericPhone;
  }

  if (numericPhone.length === 11 && validDDDs.includes(numericPhone.substring(0, 2))) {
    return '55' + numericPhone;
  }

  return numericPhone;
}

// Função de envio com logs detalhados
async function sendMessage(phone, message) {
  const formattedPhone = formatPhoneNumber(phone);
  console.log('⌛ Tentando enviar para:', formattedPhone);
  console.log('📝 Mensagem:', message);

  try {
    const response = await axios.post(
      `${ZAPI_URL}/send-text`,
      {
        phone: formattedPhone,
        message
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Resposta da Z-API:', response.data);

    if (!response.data || response.data.sent !== true) {
      throw new Error('Resposta inesperada da Z-API: ' + JSON.stringify(response.data));
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', {
      url: `${ZAPI_URL}/send-text`,
      phone: formattedPhone,
      error: error.response?.data || error.message,
      stack: error.stack
    });
    return false;
  }
}

// Webhook principal
router.post('/webhook', async (req, res) => {
  try {
    console.log('📩 Webhook recebido:', JSON.stringify(req.body, null, 2));

    const sender = req.body?.phone;
    const text = req.body?.text?.message?.trim().toLowerCase();

    if (!sender || !text) {
      return res.status(400).send('Telefone ou mensagem ausentes');
    }

    const menuMessage = `🐾 *PetShop HappyPaws* 🐾\n\nPor favor, escolha uma opção:\n1️⃣ Recepção\n2️⃣ Creche e Hotel\n3️⃣ Banho e Tosa\n4️⃣ Veterinária\n5️⃣ Financeiro\n6️⃣ Diretoria\n\nDigite apenas o número correspondente`;

    if (!['1', '2', '3', '4', '5', '6'].includes(text)) {
      const sent = await sendMessage(sender, menuMessage);
      if (!sent) {
        console.error('Falha ao enviar menu para:', sender);
      }
      return res.sendStatus(200);
    }

    const department = departments[text];
    const responseMessage = department
      ? `🔁 Conectando você com *${department}*...`
      : '❌ Opção inválida. Por favor, tente novamente.';

    const sent = await sendMessage(sender, responseMessage);
    if (!sent) {
      console.error('Falha ao enviar resposta para:', sender);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('🔥 Erro no webhook:', error);
    return res.status(500).send('Erro interno no servidor');
  }
});

// Rota de teste opcional
router.get('/test-send', async (req, res) => {
  const phone = req.query.phone;
  if (!phone) return res.status(400).send('Parâmetro "phone" obrigatório');

  const ok = await sendMessage(phone, '🚀 Teste de envio manual');
  res.json({ sucesso: ok });
});

module.exports = router;
