import { Request, Response } from "express";
import jwt, { SignOptions } from 'jsonwebtoken';
import { envs } from '../config/envs';
import { AppError } from '../middlewares/error.middleware';

/**
 * @swagger
 * definitions:
 *   LoginRequest:
 *     type: object
 *     required:
 *       - username
 *       - password
 *     properties:
 *       username:
 *         type: string
 *         description: Nombre de usuario
 *         example: admin
 *       password:
 *         type: string
 *         description: Contraseña del usuario
 *         example: Bdatam2025!
 *   
 *   AuthResponse:
 *     type: object
 *     properties:
 *       success:
 *         type: boolean
 *       token:
 *         type: string
 *         description: JWT token para autenticación
 *       expiresIn:
 *         type: string
 *         description: Tiempo de expiración del token
 *       user:
 *         type: object
 *         properties:
 *           username:
 *             type: string
 *           role:
 *             type: string
 *   
 *   ErrorResponse:
 *     type: object
 *     properties:
 *       success:
 *         type: boolean
 *         example: false
 *       error:
 *         type: string
 *         description: Mensaje de error
 */

interface LoginRequest {
    username: string;
    password: string;
}

interface AuthResponse {
    success: boolean;
    token?: string;
    expiresIn?: string;
    user?: {
        username: string;
        role: string;
    };
    error?: string;
}

export class AuthController {
    
    private static readonly VALID_USERS = [
        { username: 'admin', password: 'Bdatam2025!', role: 'admin' },
        { username: 'user', password: 'User2025!', role: 'user' },
        { username: 'api', password: 'Api2025!', role: 'api' }
    ];

    /**
     * @swagger
     * /auth/login:
     *   post:
     *     summary: Iniciar sesión
     *     description: Autenticar usuario y obtener token JWT
     *     tags: [Autenticación]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/definitions/LoginRequest'
     *     responses:
     *       200:
     *         description: Login exitoso
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/definitions/AuthResponse'
     *       400:
     *         description: Datos inválidos
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/definitions/ErrorResponse'
     *       401:
     *         description: Credenciales inválidas
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/definitions/ErrorResponse'
     *       500:
     *         description: Error interno del servidor
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/definitions/ErrorResponse'
     */
    static async login(req: Request<{}, {}, LoginRequest>, res: Response<AuthResponse>) {
        try {
            const { username, password } = req.body;

            // Validar credenciales
            const user = AuthController.VALID_USERS.find(u => 
                u.username === username && u.password === password
            );

            if (!user) {
                throw new AppError('Credenciales inválidas', 401, {
                    username: 'Usuario o contraseña incorrectos'
                });
            }

            // Generar token JWT
            const payload = {
                username: user.username,
                role: user.role
            };

            const signOptions: SignOptions = {
                expiresIn: envs.jwtExpiresIn as any
            };
            const token = jwt.sign(payload, envs.jwtSecret, signOptions);

            // Calcular fecha de expiración
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + parseInt(envs.jwtExpiresIn.replace('s', '')));

            return res.status(200).json({
                success: true,
                token,
                expiresIn: envs.jwtExpiresIn,
                user: {
                    username: user.username,
                    role: user.role
                }
            });

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            
            console.error('Error en login:', error);
            throw new AppError('Error al procesar la autenticación', 500);
        }
    }

    /**
     * @swagger
     * /auth/validate:
     *   get:
     *     summary: Validar token JWT
     *     description: Verifica si el token JWT es válido y retorna la información del usuario
     *     tags: [Autenticación]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Token válido
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 user:
     *                   type: object
     *                   properties:
     *                     username:
     *                       type: string
     *                     role:
     *                       type: string
     *       401:
     *         description: Token inválido o expirado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/definitions/ErrorResponse'
     *       500:
     *         description: Error interno del servidor
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/definitions/ErrorResponse'
     */
    static async validateToken(req: Request, res: Response) {
        try {
            // El token ya fue validado por el middleware authenticateToken
            const user = (req as any).user;

            if (!user) {
                throw new AppError('Usuario no encontrado en el token', 401);
            }

            return res.status(200).json({
                success: true,
                user: {
                    username: user.username,
                    role: user.role
                }
            });

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            
            console.error('Error al validar token:', error);
            throw new AppError('Error al validar el token', 500);
        }
    }

    /**
     * @swagger
     * /auth/refresh:
     *   post:
     *     summary: Refrescar token JWT
     *     description: Genera un nuevo token JWT a partir de uno existente válido
     *     tags: [Autenticación]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Token refrescado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/definitions/AuthResponse'
     *       401:
     *         description: Token inválido o expirado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/definitions/ErrorResponse'
     *       500:
     *         description: Error interno del servidor
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/definitions/ErrorResponse'
     */
    static async refreshToken(req: Request, res: Response) {
        try {
            const user = (req as any).user;

            if (!user) {
                throw new AppError('Usuario no encontrado', 401);
            }

            // Generar nuevo token
            const payload = {
                username: user.username,
                role: user.role
            };

            const signOptions: SignOptions = {
                expiresIn: envs.jwtExpiresIn as any
            };
            const newToken = jwt.sign(payload, envs.jwtSecret, signOptions);

            return res.status(200).json({
                success: true,
                token: newToken,
                expiresIn: envs.jwtExpiresIn,
                user: {
                    username: user.username,
                    role: user.role
                }
            });

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            
            console.error('Error al refrescar token:', error);
            throw new AppError('Error al refrescar el token', 500);
        }
    }
}