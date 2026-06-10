import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const isProd = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || 'oshop-dev-secret';

if (isProd && (!process.env.JWT_SECRET || jwtSecret === 'oshop-dev-secret')) {
  throw new Error('JWT_SECRET must be set in production');
}

export const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  databaseUrl: process.env.DATABASE_URL || '',
  isProd,
};
