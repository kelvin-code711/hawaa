// Firebase Cloud Functions for PhonePe Integration
// CORS-hardened (whitelist + OPTIONS preflight) for local + production

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const cors = require('cors');

admin.initializeApp();

/* ---------- CORS ---------- */
const ALLOWED_ORIGINS = [
  'http://127.0.0.1:5500',  // Live Server (default)
  'http://localhost:5500',  // Alternate
  'https://www.hawaa.in'    // Production
];

const corsHandler = cors({
  origin: (origin, cb) => {
    // Allow tools like curl/postman (no origin)
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
});

// Helper to answer preflight quickly and consistently
function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    // Explicit headers so browsers see them in preflight
    const origin = req.get('origin');
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin || '*');
      res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(204).send('');
      return true; // handled
    }
  }
  return false; // continue
}

/* ---------- PhonePe Config ---------- */
const PHONEPE_CONFIG = {
  merchantId: 'M01IMCT0B',
  saltKey: 'YOUR_SALT_KEY_HERE', // <-- replace with actual Salt Key
  saltIndex: 1,
  baseUrl: 'https://api-preprod.phonepe.com/apis/pg-sandbox' // UAT
  // For prod: 'https://api.phonepe.com/apis/hermes'
};

/* ---------- Utils ---------- */
function generateChecksum(payload, saltKey, saltIndex) {
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const checksumString = base64Payload + '/pg/v1/pay' + saltKey;
  const checksum = crypto.createHash('sha256').update(checksumString).digest('hex');
  return `${checksum}###${saltIndex}`;
}

function verifyChecksum(base64Response, checksum, saltKey) {
  const checksumString = base64Response + saltKey;
  const calculated = crypto.createHash('sha256').update(checksumString).digest('hex');
  return calculated === checksum;
}

function setOriginHeader(req, res) {
  const origin = req.get('origin');
  if (!origin || ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin || '*');
  }
}

/* ---------- initiatePhonePePayment ---------- */
exports.initiatePhonePePayment = functions.https.onRequest((req, res) => {
  // Always run cors first
  corsHandler(req, res, async () => {
    if (handlePreflight(req, res)) return;

    try {
      setOriginHeader(req, res);

      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
      }

      const {
        merchantTransactionId,
        amount,
        merchantUserId,
        redirectUrl,
        callbackUrl,
        email,
        mobile,
        orderDetails
      } = req.body || {};

      if (!merchantTransactionId || !amount || !merchantUserId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: merchantTransactionId, amount, merchantUserId'
        });
      }

      const phonepePayload = {
        merchantId: PHONEPE_CONFIG.merchantId,
        merchantTransactionId,
        merchantUserId,
        amount,
        redirectUrl: redirectUrl || 'https://www.hawaa.in/sections/payment-success.html',
        redirectMode: 'REDIRECT',
        callbackUrl: callbackUrl || 'https://hawaa-df1cc.cloudfunctions.net/phonepe-callback',
        paymentInstrument: { type: 'PAY_PAGE' }
      };

      const xVerify = generateChecksum(phonepePayload, PHONEPE_CONFIG.saltKey, PHONEPE_CONFIG.saltIndex);
      const headers = {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'accept': 'application/json'
      };
      const base64Payload = Buffer.from(JSON.stringify(phonepePayload)).toString('base64');

      const fetch = require('node-fetch'); // v2 in package.json
      const phonepeResp = await fetch(`${PHONEPE_CONFIG.baseUrl}/pg/v1/pay`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ request: base64Payload })
      });

      const responseData = await phonepeResp.json();

      if (phonepeResp.ok && responseData && responseData.success) {
        await admin.firestore().collection('orders').doc(merchantTransactionId).set({
          merchantTransactionId,
          amount,
          email,
          mobile,
          orderDetails,
          status: 'INITIATED',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          phonepeResponse: responseData
        });

        return res.json({
          success: true,
          message: 'Payment initiated successfully',
          data: responseData.data,
          transactionId: merchantTransactionId
        });
      } else {
        return res.status(400).json({
          success: false,
          message: (responseData && responseData.message) || 'Payment initiation failed',
          error: responseData
        });
      }
    } catch (err) {
      console.error('Error initiating PhonePe payment:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
      });
    }
  });
});

/* ---------- phonepeCallback ---------- */
exports.phonepeCallback = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (handlePreflight(req, res)) return;

    try {
      setOriginHeader(req, res);

      const { response } = req.body || {};
      if (!response) {
        return res.status(400).json({ success: false, message: 'No response data' });
      }

      const decoded = Buffer.from(response, 'base64').toString('utf-8');
      const callbackData = JSON.parse(decoded);

      // Optional checksum verify (if PhonePe sends x-verify)
      const xVerifyHdr = req.headers['x-verify'];
      if (xVerifyHdr) {
        const [checksum] = String(xVerifyHdr).split('###');
        const ok = verifyChecksum(response, checksum, PHONEPE_CONFIG.saltKey);
        if (!ok) {
          return res.status(400).json({ success: false, message: 'Invalid checksum' });
        }
      }

      const { merchantTransactionId, transactionId, amount, state, responseCode } = callbackData.data || {};

      const orderRef = admin.firestore().collection('orders').doc(merchantTransactionId);
      const orderDoc = await orderRef.get();
      if (!orderDoc.exists) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      await orderRef.update({
        status: state,
        transactionId,
        responseCode,
        callbackData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // You can choose to redirect here if using a hosted callback page,
      // but for safety we just acknowledge success.
      return res.json({ success: true, message: 'Callback processed' });
    } catch (err) {
      console.error('Error processing PhonePe callback:', err);
      return res.status(500).json({ success: false, message: 'Callback processing failed', error: err.message });
    }
  });
});

/* ---------- checkPaymentStatus ---------- */
exports.checkPaymentStatus = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (handlePreflight(req, res)) return;

    try {
      setOriginHeader(req, res);

      const { merchantTransactionId } = req.query || {};
      if (!merchantTransactionId) {
        return res.status(400).json({ success: false, message: 'merchantTransactionId is required' });
      }

      const checksumString = `/pg/v1/status/${PHONEPE_CONFIG.merchantId}/${merchantTransactionId}` + PHONEPE_CONFIG.saltKey;
      const checksum = crypto.createHash('sha256').update(checksumString).digest('hex');
      const xVerify = `${checksum}###${PHONEPE_CONFIG.saltIndex}`;

      const fetch = require('node-fetch');
      const statusResp = await fetch(
        `${PHONEPE_CONFIG.baseUrl}/pg/v1/status/${PHONEPE_CONFIG.merchantId}/${merchantTransactionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': xVerify,
            'X-MERCHANT-ID': PHONEPE_CONFIG.merchantId,
            'accept': 'application/json'
          }
        }
      );

      const statusData = await statusResp.json();

      if (statusResp.ok && statusData && statusData.success) {
        await admin.firestore().collection('orders').doc(merchantTransactionId).update({
          status: statusData.data.state,
          lastStatusCheck: admin.firestore.FieldValue.serverTimestamp(),
          statusResponse: statusData
        });

        return res.json({ success: true, data: statusData.data });
      } else {
        return res.status(400).json({
          success: false,
          message: (statusData && statusData.message) || 'Status check failed'
        });
      }
    } catch (err) {
      console.error('Status check failure:', err);
      return res.status(500).json({ success: false, message: 'Status check failed', error: err.message });
    }
  });
});

/* ---------- getOrder ---------- */
exports.getOrder = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (handlePreflight(req, res)) return;

    try {
      setOriginHeader(req, res);

      const { orderId } = req.query || {};
      if (!orderId) {
        return res.status(400).json({ success: false, message: 'orderId is required' });
      }

      const doc = await admin.firestore().collection('orders').doc(orderId).get();
      if (!doc.exists) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const orderData = doc.data();
      // remove potentially sensitive blobs before returning
      delete orderData.phonepeResponse;
      delete orderData.callbackData;

      return res.json({ success: true, data: orderData });
    } catch (err) {
      console.error('Get order failure:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch order', error: err.message });
    }
  });
});
