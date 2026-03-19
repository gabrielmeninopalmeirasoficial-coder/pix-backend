const https = require('https');

const API_KEY = 'gk_62467cc663d681c7cfe1dd8f238406b9cb2043c504c59b18';

function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Metodo nao permitido' }));
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    let data;
    try { data = JSON.parse(body); } catch (e) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'JSON invalido' }));
      return;
    }

    const payload = JSON.stringify({
      amountCents:   data.amountCents || 3000,
      description:   'Doacao - Campanha Biel',
      payerName:     'Doador Anonimo',
      payerDocument: '11144477735',
      externalId:    'doacao-' + Date.now()
    });

    const options = {
      hostname: 'ggpixapi.com',
      path:     '/api/v1/pix/in',
      method:   'POST',
      headers:  {
        'Content-Type': 'application/json',
        'X-API-Key':    API_KEY,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const apiReq = https.request(options, apiRes => {
      let apiBody = '';
      apiRes.on('data', chunk => apiBody += chunk);
      apiRes.on('end', () => {
        res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(apiBody);
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
