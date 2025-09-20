// Vercel Serverless Function: POST /api/ingest
const admin = require("firebase-admin");

if (!admin.apps.length) {
  const projectId   = process.env.GOOGLE_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey  = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey })
  });
}
const db = admin.firestore();

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
    if ((req.headers["x-api-key"] || "") !== process.env.API_KEY) {
      return res.status(401).send("Unauthorized");
    }

    const { deviceId, ts, metrics } = req.body || {};
    if (!deviceId || !metrics) return res.status(400).send("Bad Request");

    const doc = {
      deviceId,
      ts: admin.firestore.Timestamp.now(), // server time
      tsClient: ts ?? null,
      metrics
    };

    const ref = await db.collection("devices").doc(deviceId)
      .collection("readings").add(doc);

    return res.json({ ok: true, id: ref.id });
  } catch (e) {
    console.error(e);
    return res.status(500).send("Internal Error");
  }
};
