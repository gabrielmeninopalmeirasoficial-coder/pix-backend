const https = require('https');

const PUBLIC_KEY = 'hojesimdeusestacomigo23_l2om3e295x0uw6nl';
const SECRET_KEY = 'cxj5x84cfiobzn5ezhc4pwmkqexzl71tlworfv1qfozcvykqk8bixyyoxozh25ba';

function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  if (req.method !== 'POST') { res.writeHead(405); res.end(JSON.stringify({ error: 'Metodo nao permitido' })); return; }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    let data;
    try { data = JSON.parse(body); } catch (e) {
      res.writeHead(400); res.end(JSON.stringify({ error: 'JSON invalido' })); return;
    }

    const amountReais = (data.amountCents || 3000) / 100;

    const payload = JSON.stringify({
      identifier: 'projeto-' + Date.now(),
      amount: amountReais,
      client: {
        name: 'projeto1',
        email: 'projeto@projeto.com',
        phone: '(11) 99999-9999',
        document: '111.444.777-35'
      },
      products: [
        { id: 'projeto-um', name: 'projeto - um', quantity: 1, price: amountReais }
      ]
    });

    const options = {
      hostname: 'app.vizzionpay.com.br',
      path: '/api/v1/gateway/pix/receive',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-public-key': PUBLIC_KEY,
        'x-secret-key': SECRET_KEY,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const apiReq = https.request(options, apiRes => {
      let apiBody = '';
      apiRes.on('data', chunk => apiBody += chunk);
      apiRes.on('end', () => {
        try {
          const parsed = JSON.parse(apiBody);
          // Adapta resposta para o formato que o pix-checkout.js espera
          const pixCode = parsed.pix && parsed.pix.code;
          res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            pixCopyPaste: pixCode || null,
            transactionId: parsed.transactionId || null,
            raw: parsed
          }));
        } catch (e) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Erro ao processar resposta' }));
        }
      });
    });

    apiReq.on('error', () => {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Erro ao conectar com a API' }));
    });

    apiReq.write(payload);
    apiReq.end();
  });
}

const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer(handler).listen(PORT, () => {
  console.log('Servidor rodando na porta ' + PORT);
});
