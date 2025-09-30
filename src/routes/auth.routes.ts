import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { asyncHandler } from '../middlewares/error.middleware';  

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Endpoints de autenticación y autorización
 * 
 * securityDefinitions:
 *   bearerAuth:
 *     type: apiKey
 *     name: Authorization
 *     in: header
 *     description: JWT Token Bearer. Ejemplo: "Bearer {token}"
 *   apiKey:
 *     type: apiKey
 *     name: X-API-Key
 *     in: header
 *     description: API Key para acceso a servicios externos
 * 
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica un usuario y devuelve un token JWT
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Nombre de usuario
 *                 example: admin
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *                 example: Bdatam2025!
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: Token JWT para autenticación
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 expiresIn:
 *                   type: string
 *                   description: Tiempo de expiración del token
 *                   example: 24h
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       example: admin
 *                     role:
 *                       type: string
 *                       example: admin
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/ErrorResponse'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/ValidationError'
 */

export class AuthRoutes {
    
    static get routes() {
        const router = Router();
        
        // Rutas públicas
        /**
         * @swagger
         * /auth/login:
         *   post:
         *     summary: Iniciar sesión
         *     description: Autentica un usuario y devuelve un token JWT
         *     tags: [Autenticación]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - username
         *               - password
         *             properties:
         *               username:
         *                 type: string
         *                 description: Nombre de usuario
         *                 example: admin
         *               password:
         *                 type: string
         *                 description: Contraseña del usuario
         *                 example: Bdatam2025!
         *     responses:
         *       200:
         *         description: Login exitoso
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   example: true
         *                 token:
         *                   type: string
         *                   description: Token JWT para autenticación
         *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
         *                 expiresIn:
         *                   type: string
         *                   description: Tiempo de expiración del token
         *                   example: 24h
         *                 user:
         *                   type: object
         *                   properties:
         *                     username:
         *                       type: string
         *                       example: admin
         *                     role:
         *                       type: string
         *                       example: admin
         *       401:
         *         description: Credenciales inválidas
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/definitions/ErrorResponse'
         *       400:
         *         description: Error de validación
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/definitions/ValidationError'
         */
        router.post('/auth/login', ValidationMiddleware.loginValidation, asyncHandler(AuthController.login));
        
        /**
         * @swagger
         * /auth/validate:
         *   get:
         *     summary: Validar token
         *     description: Valida si un token JWT es válido y devuelve información del usuario
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
         *                       example: admin
         *                     role:
         *                       type: string
         *                       example: admin
         *                 message:
         *                   type: string
         *                   example: Token válido
         *       401:
         *         description: Token inválido o expirado
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/definitions/ErrorResponse'
         */
        router.get('/auth/validate', authenticateToken, asyncHandler(AuthController.validateToken));
        
        /**
         * @swagger
         * /auth/refresh:
         *   post:
         *     summary: Refrescar token
         *     description: Genera un nuevo token JWT a partir de uno válido
         *     tags: [Autenticación]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Token refrescado exitosamente
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   example: true
         *                 token:
         *                   type: string
         *                   description: Nuevo token JWT
         *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
         *                 expiresIn:
         *                   type: string
         *                   description: Tiempo de expiración del nuevo token
         *                   example: 24h
         *                 user:
         *                   type: object
         *                   properties:
         *                     username:
         *                       type: string
         *                       example: admin
         *                     role:
         *                       type: string
         *                       example: admin
         *       401:
         *         description: Token inválido o expirado
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/definitions/ErrorResponse'
         */
        router.post('/auth/refresh', authenticateToken, asyncHandler(AuthController.refreshToken));
        
        return router;
    }
}