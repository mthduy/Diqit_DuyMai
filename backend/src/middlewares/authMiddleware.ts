import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protectedRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        message: 'Access token not found!',
      });
    }

    // Xác nhận token hợp lệ
    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string,
      async (err, decodedUser) => {
        if (err) {
          console.log(err);
          return res.status(403).json({
            message: 'Access token expired or invalid!',
          });
        }

        if (!decodedUser || typeof decodedUser === 'string') {
          return res.status(403).json({
            message: 'Invalid token!',
          });
        }

        const { userId } = decodedUser as jwt.JwtPayload & { userId?: string };

        if (!userId) {
          return res.status(403).json({
            message: 'Token does not contain userId!',
          });
        }

        // Tìm user
        const user = await User.findById(userId).select('-hashedPassword');
        if (!user) {
          return res.status(404).json({
            message: 'User not found.',
          });
        }

        req.user = user;
        next();
      }
    );
  } catch (error) {
    console.log('Error verifying JWT in authMiddleware:', error);
    return res.status(500).json({
      message: 'Server error, please try again later!',
    });
  }
};
