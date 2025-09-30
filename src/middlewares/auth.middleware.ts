// src/middleware/auth.middleware.ts
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { envs } from '../config/envs';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    jwt.verify(token, envs.jwtSecret, (err: any, user: any) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        (req as any).user = user;
        next();
    });
};