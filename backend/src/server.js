import { app } from './app.js';
import { env } from './config/env.js';
import { db } from './config/db.js';

const PORT = env.PORT || 3000;

const startServer = async () => {
  await db(); // ✅ will throw if DB fails

  app.listen(PORT, () => {
    console.log(`🚀 Server running at ${env.APP_URL}`);
  });
};

startServer();
