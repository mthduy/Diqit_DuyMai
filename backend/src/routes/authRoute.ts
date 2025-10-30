import express from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
} from '../controllers/authController.js';
import { z } from 'zod';
import { validateBody } from '../middlewares/validateBody.js';

const router = express.Router();

const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  email: z.email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
export default router;
