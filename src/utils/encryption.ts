import CryptoJS from 'crypto-js';

// Generate a unique encryption key for each user
export function generateEncryptionKey(): string {
  return CryptoJS.lib.WordArray.random(256 / 8).toString();
}

// Encrypt data using AES
export function encryptData(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString();
}

// Decrypt data using AES
export function decryptData(encryptedData: string, key: string): string | null {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    // Validate decryption succeeded
    if (!result) {
      return null;
    }
    return result;
  } catch (error) {
    // Avoid logging sensitive information
    return null;
  }
}

// Hash a password or key for storage
export function hashKey(key: string): string {
  return CryptoJS.SHA256(key).toString();
}

// Generate a salt for additional security
export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(128 / 8).toString();
}

// Encrypt with salt for extra security
export function encryptWithSalt(data: string, key: string, salt: string): string {
  const saltedKey = key + salt;
  return CryptoJS.AES.encrypt(data, saltedKey).toString();
}

// Decrypt with salt
export function decryptWithSalt(encryptedData: string, key: string, salt: string): string | null {
  try {
    const saltedKey = key + salt;
    const decrypted = CryptoJS.AES.decrypt(encryptedData, saltedKey);
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    // Validate decryption succeeded
    if (!result) {
      return null;
    }
    return result;
  } catch (error) {
    // Avoid logging sensitive information
    return null;
  }
}

// Secure storage of encryption keys in browser
export const SecureStorage = {
  setKey(userId: string, key: string) {
    // Store in sessionStorage for current session only
    sessionStorage.setItem(`enc_key_${userId}`, key);
  },
  
  getKey(userId: string): string | null {
    return sessionStorage.getItem(`enc_key_${userId}`);
  },
  
  removeKey(userId: string) {
    sessionStorage.removeItem(`enc_key_${userId}`);
  },
  
  clearAll() {
    // Clear all encryption keys from session
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('enc_key_')) {
        sessionStorage.removeItem(key);
      }
    });
  }
};