// env.js
import dotenv from 'dotenv';
dotenv.config();
const env = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,

  MAILTRAP: {
    HOST: process.env.MAILTRAP_SMTP_HOST,
    PORT: process.env.MAILTRAP_SMTP_PORT,
    USER: process.env.MAILTRAP_SMTP_USER,
    PASS: process.env.MAILTRAP_SMTP_PASS,
  },

  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  APP_URL: process.env.APP_URL,
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
};

export { env };
