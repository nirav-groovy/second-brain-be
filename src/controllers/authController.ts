import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import { Request, Response } from 'express';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || '';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    return res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user: any = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ success: true, data: { token, user: { id: user._id, name: user.name, email: user.email } } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
