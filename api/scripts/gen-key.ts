// Gera uma DATA_ENCRYPTION_KEY (32 bytes, base64). Uso: npm run gen:key
import { randomBytes } from 'node:crypto';

console.log(randomBytes(32).toString('base64'));
