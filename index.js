{\rtf1\ansi\ansicpg1252\cocoartf2865
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import express from "express";\
import http2 from "http2";\
\
const app = express();\
app.use(express.json());\
\
app.post("/send", async (req, res) => \{\
  const \{ deviceToken, jwtToken, payload \} = req.body;\
\
  if (!deviceToken || !jwtToken) \{\
    return res.status(400).json(\{ error: "Missing deviceToken or jwtToken" \});\
  \}\
\
  try \{\
    const client = http2.connect("https://api.push.apple.com", \{\
      ALPNProtocols: ["h2"]\
    \});\
\
    const path = `/3/device/$\{deviceToken\}`;\
    const headers = \{\
      ":method": "POST",\
      ":path": path,\
      "authorization": `bearer $\{jwtToken\}`,\
      "apns-topic": "pass.com.patio785.club",\
      "content-type": "application/json"\
    \};\
\
    const reqHttp2 = client.request(headers);\
    reqHttp2.write(JSON.stringify(payload || \{\}));\
    reqHttp2.end();\
\
    let responseData = "";\
    reqHttp2.on("data", chunk => (responseData += chunk));\
    reqHttp2.on("end", () => \{\
      client.close();\
      res.json(\{ success: true, response: responseData \});\
    \});\
\
    reqHttp2.on("error", err => \{\
      console.error("HTTP/2 Error:", err);\
      client.close();\
      res.status(500).json(\{ error: err.message \});\
    \});\
  \} catch (err) \{\
    res.status(500).json(\{ error: err.message \});\
  \}\
\});\
\
app.get("/", (_, res) => res.send("\uc0\u9989  Apple Push Proxy running on Vercel"));\
\
export default app;}