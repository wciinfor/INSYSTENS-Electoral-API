import { app } from './app';

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const start = async () => {
  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`Server listening on http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
