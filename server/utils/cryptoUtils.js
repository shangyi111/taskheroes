const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const encryptionKeyHex = process.env.MESSAGE_ENCRYPTION_KEY;
const encryptionKey = Buffer.from(encryptionKeyHex, 'hex');

exports.encryptMessage = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { iv: iv.toString('hex'), encryptedData: encrypted };
};

exports.decryptMessage = (ivHex, encryptedData) => {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, encryptionKey, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};