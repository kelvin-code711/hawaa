const functions = require("firebase-functions");
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/**
 * DEV NOTE (no auth, for testing only):
 * We'll keep this open for now so you can test quickly.
 * Later we’ll lock it down with auth & signatures.
 */

/**
 * Enqueue a command for a device (you’ll use this to test)
 * POST /enqueueCommand
 * body: { deviceId: "H1001", command: { type: "POWER", value: "ON" } }
 */
exports.enqueueCommand = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).send("Use POST");
    const { deviceId, command } = req.body || {};
    if (!deviceId || !command) return res.status(400).send("Missing deviceId or command");

    const qRef = db.collection("devices").doc(deviceId).collection("queue");
    const cmdDoc = {
      command,
      status: "queued",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await qRef.add(cmdDoc);
    res.status(200).json({ ok: true, id: docRef.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

/**
 * Device polls for next command (your PCB guy will use this)
 * GET /nextCommand?deviceId=H1001
 * Returns: { hasCommand: true/false, id, command }
 * If it returns a command, the device should execute it and
 * then call ackCommand to mark done.
 */
exports.nextCommand = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "GET") return res.status(405).send("Use GET");
    const deviceId = req.query.deviceId;
    if (!deviceId) return res.status(400).send("Missing deviceId");

    const qRef = db.collection("devices").doc(deviceId).collection("queue");
    const snap = await qRef.where("status", "==", "queued")
                           .orderBy("createdAt", "asc")
                           .limit(1)
                           .get();

    if (snap.empty) return res.status(200).json({ hasCommand: false });

    const doc = snap.docs[0];
    // "reserve" it so two polls don’t take same command
    await doc.ref.update({ status: "in_progress", pickedAt: admin.firestore.FieldValue.serverTimestamp() });

    res.status(200).json({
      hasCommand: true,
      id: doc.id,
      command: doc.data().command
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

/**
 * Device acknowledges completion of a command
 * POST /ackCommand
 * body: { deviceId: "H1001", id: "<commandDocId>", result: "OK" }
 */
exports.ackCommand = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).send("Use POST");
    const { deviceId, id, result } = req.body || {};
    if (!deviceId || !id) return res.status(400).send("Missing deviceId or id");

    const cmdRef = db.collection("devices").doc(deviceId).collection("queue").doc(id);
    await cmdRef.update({
      status: "done",
      result: result || "OK",
      doneAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

/**
 * Optional: device can report its current state to Firestore
 * POST /reportState
 * body: { deviceId: "H1001", state: { power: "ON", fan: 2, filterHours: 120 } }
 */
exports.reportState = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).send("Use POST");
    const { deviceId, state } = req.body || {};
    if (!deviceId || !state) return res.status(400).send("Missing deviceId or state");

    const devRef = db.collection("devices").doc(deviceId);
    await devRef.set({
      state,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});
