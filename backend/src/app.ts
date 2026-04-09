import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import healthRoutes from './routes/health.routes';
import reservationRoutes from './routes/reservation.routes';
import reviewRoutes from './routes/review.routes';

const app = express();

app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true
  })
);
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    message: 'Richard\'s Restaurant Grill API is running.'
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/reviews', reviewRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
