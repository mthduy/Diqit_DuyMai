import { connectDB } from './configs/db.js';
import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoute.js';
import cookieParser from 'cookie-parser';
import userRoute from './routes/userRoute.js';
import boardRoute from './routes/boardRoute.js';
import workspaceRoute from './routes/workspaceRoute.js';
import { protectedRoute } from './middlewares/authMiddleware.js';
import cors from 'cors';
import { mongoErrorHandler } from './utils/mongoError.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL, // cổng frontend của bạn
    credentials: true, // nếu dùng cookie/token
  })
);

app.use('/api/auth', authRoutes);

app.use(protectedRoute);
app.use('/api/boards', boardRoute);
app.use('/api/users', userRoute);
app.use('/api/workspaces', workspaceRoute);

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Server is running successfully!',
  });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
});

// global Mongo/Mongoose error handler (should be last middleware)
app.use(mongoErrorHandler as any);
