function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function encryptPassword(password: string): string {
  const secret = import.meta.env.VITE_PASSWORD_SECRET || 'omnisteer-password-key';
  const pwdBytes = new TextEncoder().encode(password);
  const keyBytes = new TextEncoder().encode(secret);
  const out = new Uint8Array(pwdBytes.length);
  for (let i = 0; i < pwdBytes.length; i += 1) {
    out[i] = pwdBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return `enc:${bytesToBase64(out)}`;
}
