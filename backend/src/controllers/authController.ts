import bcrypt from 'bcrypt';
import express from 'express';
import type { Request, Response } from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/Session.js';

const ACCESS_TOKEN_TTL = '30m';
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;

    if (!username || !password || !email || !firstName || !lastName) {
      return res.status(400).json({ message: 'All required fields must be filled!' });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(409).json({
        message:
          existingUser.username === username
            ? 'Username already exists'
            : 'Email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      hashedPassword,
      email,
      displayName: `${firstName} ${lastName}`,
    });

    return res.status(201).json({ message: 'Registration successful!' });
  } catch (error) {
    console.log('Error in register:', error);
    return res.status(500).json({ message: 'Server error, please try again later!' });
  }
};


export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: 'All required fields must be filled!' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password!' });
    }

    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);
    if (!passwordCorrect) {
      return res.status(401).json({ message: 'Invalid username or password!' });
    }

    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    const refreshToken = crypto.randomBytes(64).toString('hex');

    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: REFRESH_TOKEN_TTL,
    });

    return res.status(200).json({
      message: `User ${user.displayName} logged in successfully!`,
      accessToken,
    });
  } catch (error) {
    console.log('Error in login:', error);
    return res
      .status(500)
      .json({ message: 'Server error, please try again later!' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(400).json({ message: 'Token not found!' });
    } else {
      await Session.deleteOne({ refreshToken: token });
      res.clearCookie('refreshToken');
    }

    return res.sendStatus(204);
  } catch (error) {
    console.log('Error in logout:', error);
    return res
      .status(500)
      .json({ message: 'Server error, please try again later!' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'Token does not exist.' });
    }

    const session = await Session.findOne({ refreshToken: token });

    if (!session) {
      return res.status(403).json({ message: 'Invalid or expired token!' });
    }

    if (session.expiresAt < new Date()) {
      return res.status(403).json({ message: 'Token has expired!' });
    }

    const accessToken = jwt.sign(
      { userId: session.userId },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error('Error in refreshToken:', error);
    return res.status(500).json({ message: 'Server error!' });
  }
};
