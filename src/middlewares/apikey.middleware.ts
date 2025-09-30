import { NextFunction, Request, Response } from 'express';
import { envs } from '../config/envs';

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: X-API-Key
 *       description: |
 *         API Key para acceso a servicios externos.
 *         
 *         **Tipos de API Keys disponibles:**
 *         - `admin`: Acceso completo a todos los endpoints
 *         - `swagger`: Acceso limitado para documentación
 *         - `external-service`: Acceso para servicios externos
 *         
 *         **Ejemplo de uso:**
 *         ```
 *         X-API-Key: tu-api-key-aqui
 *         ```
 *       x-examples:
 *         admin-key:
 *           summary: API Key de administrador
 *           value: admin-key-12345
 *         swagger-key:
 *           summary: API Key para Swagger
 *           value: swagger-key-12345
 *         external-key:
 *           summary: API Key de servicio externo
 *           value: external-key-12345
 */

export interface ApiKeyRequest extends Request {
    apiKey?: string;
    apiUser?: string;
}

export class ApiKeyMiddleware {
    
    private static readonly VALID_API_KEYS = new Map<string, string>([
        [envs.apiKey, 'admin'],
        ['bdatam-swagger-2025', 'swagger'],
        ['bdatam-external-2025', 'external-service']
    ]);

    static validateApiKey(req: ApiKeyRequest, res: Response, next: NextFunction) {
        try {
            const apiKey = req.headers['x-api-key'] as string;
            
            if (!apiKey) {
                return res.status(401).json({
                    success: false,
                    error: 'API Key requerida',
                    message: 'Por favor proporcione una API Key válida en el header X-API-Key'
                });
            }

            const user = ApiKeyMiddleware.VALID_API_KEYS.get(apiKey);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'API Key inválida',
                    message: 'La API Key proporcionada no es válida'
                });
            }

            req.apiKey = apiKey;
            req.apiUser = user;
            
            next();
        } catch (error) {
            console.error('Error en API Key middleware:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    static optionalApiKey(req: ApiKeyRequest, res: Response, next: NextFunction) {
        const apiKey = req.headers['x-api-key'] as string;
        
        if (apiKey) {
            const user = ApiKeyMiddleware.VALID_API_KEYS.get(apiKey);
            if (user) {
                req.apiKey = apiKey;
                req.apiUser = user;
            }
        }
        
        next();
    }

    static requireRole(allowedRoles: string[]) {
        return (req: ApiKeyRequest, res: Response, next: NextFunction) => {
            const userRole = req.apiUser || (req as any).user?.role;
            
            if (!userRole || !allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    error: 'Acceso denegado',
                    message: 'No tienes los permisos necesarios para acceder a este recurso'
                });
            }
            
            next();
        };
    }
}