// index.js — Apple Push Proxy con APNs real
import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import http2 from "http2";
import fs from "fs";

const app = express();
app.use(bodyParser.json());

// ✅ Ruta GET simple para verificar que corre
app.get("/", (req, res) => {
  res.status(200).send("✅ Apple Push Proxy (APNs Ready)");
});

// 🔑 Variables de entorno o valores fijos (ajustá según tu configuración)
const teamId = "B9X76JU56C";
const keyId = "5TZS9PHS4K";
const passTypeId = "pass.com.patio785.club";

// Ruta donde subiste tu archivo .p8
const keyPath = "./AuthKey_5TZS9PHS4K.p8";

// 🔐 Crear token JWT para APNs
function createJwtToken() {
  const privateKey = fs.readFileSync(keyPath);
  const token = jwt.sign({}, privateKey, {
    algorithm: "ES256",
    issuer: teamId,
    header: { alg: "ES256", kid: keyId },
    expiresIn: "180d",
  });
  return token;
}

// 🚀 Ruta principal para recibir notificaciones desde send_push.php
app.post("/", async (req, res) => {
  try {
    const { deviceToken, serialNumber, message } = req.body;
    if (!deviceToken || !serialNumber) {
      return res.status(400).json({ error: "Missing deviceToken or serialNumber" });
    }

    const jwtToken = createJwtToken();

    const client = http2.connect("https://api.push.apple.com", {
      settings: { enablePush: true },
    });

    const headers = {
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      "authorization": `bearer ${jwtToken}`,
      "apns-topic": passTypeId,
      "apns-push-type": "background",
    };

    const request = client.request(headers);
    request.setEncoding("utf8");

    let responseData = "";
    request.on("data", (chunk) => (responseData += chunk));

    request.on("end", () => {
      client.close();
      console.log(`✅ Push enviado a ${deviceToken}: ${responseData}`);
      res.status(200).json({ status: "ok", response: responseData });
    });

    const payload = JSON.stringify({ aps: { alert: message || "Actualización disponible" } });
    request.write(payload);
    request.end();
  } catch (error) {
    console.error("❌ Error enviando push:", error);
    res.status(500).json({ error: error.message });
  }
});

export default app;
