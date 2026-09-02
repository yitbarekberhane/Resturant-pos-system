const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { machineIdSync } = require('node-machine-id');

// Configuration
const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = Buffer.from('thisisaverysecuresecretkey12345@', 'utf8');

// Handles paths correctly in both development and packaged Electron builds (.exe)
const getLicensePath = () => {
  return process.mainModule && process.mainModule.filename.includes('app.asar')
    ? path.join(path.dirname(process.execPath), 'license.dat')
    : path.join(__dirname, 'license.dat');
};

function validateLicense() {
  try {
    const licenseFilePath = getLicensePath();

    // 1. Check if license file exists
    if (!fs.existsSync(licenseFilePath)) {
      console.error('Validation Error: License file missing.');
      return false;
    }

    // 2. Read encrypted file
    const encryptedData = fs.readFileSync(licenseFilePath);
    if (encryptedData.length < 17) {
      console.error('Validation Error: License file corrupted or empty.');
      return false;
    }

    // 3. Extract IV (first 16 bytes) and Ciphertext
    const iv = encryptedData.subarray(0, 16);
    const ciphertext = encryptedData.subarray(16);

    // 4. Decrypt payload
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    let decrypted = decipher.update(ciphertext, null, 'utf8');
    decrypted += decipher.final('utf8');

    // 5. Parse license data
    const license = JSON.parse(decrypted);

    // 6. Verify Machine Binding
    const currentHardwareId = machineIdSync();
    if (license.hardwareId !== 'ANY_DEVICE' && license.hardwareId !== currentHardwareId) {
      console.error('Validation Error: License is registered to a different machine.');
      return false;
    }

    // 7. Verify Expiration Date
    const expirationTime = new Date(license.expirationDate).getTime();
    if (isNaN(expirationTime) || Date.now() > expirationTime) {
      console.error('Validation Error: License has expired.');
      return false;
    }

    console.log('License valid until:', license.expirationDate);
    return true;
  } catch (err) {
    console.error('Validation Error: Invalid or corrupted license key.', err.message);
    return false;
  }
}

module.exports = validateLicense;

// Execute directly if run via node validate.js
if (require.main === module) {
  const isValid = validateLicense();
  if (!isValid) process.exit(1);
}