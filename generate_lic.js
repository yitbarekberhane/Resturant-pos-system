const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { machineIdSync } = require('node-machine-id');

// 1. Encryption Configuration
const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = Buffer.from('thisisaverysecuresecretkey12345@', 'utf8'); // 32 bytes
const LICENSE_FILE_PATH = path.join(__dirname, 'license.dat');

// 2. Set expiration duration (e.g., 1 hour for testing, 30 days for production)
const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() + 30);

// 3. Construct Payload ('ANY_DEVICE' or machineIdSync())
const payload = {
  hardwareId: 'ANY_DEVICE',
  issuedAt: new Date().toISOString(),
  expirationDate: expiryDate.toISOString(),
  status: 'ACTIVE'
};

const plaintext = JSON.stringify(payload);

// 4. Encrypt Payload (16-byte random IV)
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

let encrypted = cipher.update(plaintext, 'utf8');
encrypted = Buffer.concat([encrypted, cipher.final()]);

// Concatenate IV + Encrypted Ciphertext
const encryptedPayload = Buffer.concat([iv, encrypted]);

// 5. Write binary encrypted payload to license.dat
fs.writeFileSync(LICENSE_FILE_PATH, encryptedPayload);

console.log(`Encrypted license generated successfully at: ${LICENSE_FILE_PATH}`);
console.log(`Valid until: ${payload.expirationDate}`);