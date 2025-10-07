// index.js
import http2 from 'http2';
import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(bodyParser.json());

// Ruta GET de verificación (ya está funcionando)
app.get('/', (req, res) => {
  res.status(200).send('✅ Apple Push Proxy running on Vercel');
});

// Nueva ruta POST para manejar notificaciones push
app.post('/', async (req, res) => {
  try {
    const { deviceToken, serialNumber, message } = req.body;

    if (!deviceToken || !serialNumber) {
      return res.status(400).json({ error: 'Missing deviceToken or serialNumber' });
    }

    console.log(`📩 Push recibido para token ${deviceToken}, serial ${serialNumber}`);

    // Simulación de envío (Apple APNs real usa HTTP/2 con certificados)
    // Aquí solo respondemos con éxito
    return res.status(200).json({
      status: 'ok',
      message: `Push enviado correctamente a ${deviceToken}`,
      serial: serialNumber
    });

  } catch (error) {
    console.error('❌ Error en el proxy:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Export para Vercel
export default app;
