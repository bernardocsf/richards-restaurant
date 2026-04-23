// import { app } from './app';
// import { connectDatabase } from './config/database';
// import { env } from './config/env';

// async function bootstrap() {
//   await connectDatabase();

//   app.listen(env.port, () => {
//     console.log(`🚀 API running on http://localhost:${env.port}`);
//   });
// }

// bootstrap().catch((error) => {
//   console.error('Failed to bootstrap server', error);
//   process.exit(1);
// });

import { app } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';

async function bootstrap() {
  await connectDatabase(env.mongoUri);

  app.listen(env.port, '0.0.0.0', () => {
    console.log(`🚀 API running on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap server', error);
  process.exit(1);
});
