import { randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from 'crypto';

// Provided for key-based encryption. Don't use encrypt and decrypt for passwords!
const  encrypt = (text, algorithm, secret) => {
  const iv = randomBytes(16);
  const secret32 = Buffer.concat([Buffer.from(secret), Buffer.alloc(32)], 32);
  const cipher = createCipheriv(algorithm, secret32, iv);
  let crypted = cipher.update(text);
  crypted = Buffer.concat([crypted, cipher.final()]);
  return iv.toString('hex') + ':' + crypted.toString('hex');
}

const decrypt = (text, algorithm, secret) => {
  const splitText = text.split(':');
  const iv = Buffer.from(splitText.shift(), 'hex');
  const encryptedText = Buffer.from(splitText.join(':'), 'hex');
  const secret32 = Buffer.concat([Buffer.from(secret), Buffer.alloc(32)], 32);
  const decipher = createDecipheriv(algorithm, secret32, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Use these for passwords.
const hash = (text) => {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(text, salt, 2048, 32, 'sha512').toString('hex');
  return [salt, hash].join('$');
}

const verifyHash = (text, original) => {
  const originalHash = original.split('$')[1];
  const salt = original.split('$')[0];
  const hash = pbkdf2Sync(text, salt, 2048, 32, 'sha512').toString('hex');
  return hash === originalHash;
}

export { encrypt, decrypt, hash, verifyHash };
