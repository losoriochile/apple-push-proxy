// index.js - versión con clave desde variable de entorno (Vercel compatible)
import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import http2 from "http2";

const app = express();
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.status(200).send("✅ Apple Push Proxy (Vercel + APNs Ready)");
});

const teamId = process.env.APPLE_TEAM_ID;
const keyId = process.env.APPLE_KEY_ID;
const passTypeId = process.env.APPLE_PASS_TYPE_ID;
const authKeyBase64 = process.env.APPLE_AUTH_KEY_BASE64;

// Crear token JWT para APNs
function createJwtToken() {
  const privateKey = Buffer.from(authKeyBase64, "base64").toString("utf8");
  return jwt.sign({}, privateKey, {
    algorithm: "ES256",
    issuer: teamId,
    header: { alg: "ES256", kid: keyId },
    expiresIn: "180d",
  });
}

app.post("/", async (req, res) => {
  try {
    const { deviceToken, serialNumber, message } = req.body;
    if (!deviceToken || !serialNumber)
      return res.status(400).json({ error: "Missing deviceToken or serialNumber" });

    const jwtToken = createJwtToken();
    const client = http2.connect("https://api.push.apple.com");

    const headers = {
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${jwtToken}`,
      "apns-topic": passTypeId,
      "apns-push-type": "background",
    };

    const request = client.request(headers);
    let responseData = "";
    request.on("data", (chunk) => (responseData += chunk));
    request.on("end", () => {
      client.close();
      console.log(`✅ Push enviado a ${deviceToken}: ${responseData}`);
      res.status(200).json({ ok: true, response: responseData });
    });

    const payload = JSON.stringify({
      aps: { contentAvailable: 1, alert: message || "Actualización disponible" },
    });
    request.write(payload);
    request.end();
  } catch (err) {
    console.error("❌ Error interno:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/debug", (req, res) => {
  res.json({
    team: process.env.APPLE_TEAM_ID,
    key: process.env.APPLE_KEY_ID,
    pass: process.env.APPLE_PASS_TYPE_ID,
    hasKey: !!process.env.APPLE_AUTH_KEY_BASE64,
  });
});
export default app;
