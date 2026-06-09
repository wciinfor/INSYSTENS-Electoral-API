import fastify from 'fastify';
import dotenv from 'dotenv';
import { registerRoutes } from './routes';

dotenv.config();

const app = fastify({
  logger: {
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
});

// Registrar rotas
app.register(registerRoutes);

export { app };
