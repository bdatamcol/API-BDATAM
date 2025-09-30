import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
    statusCode: number;
    isOperational?: boolean;
    details?: any;
}

export class AppError extends Error implements ApiError {
    statusCode: number;
    isOperational: boolean;
    details?: any;

    constructor(message: string, statusCode: number, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * @swagger
 * definitions:
 *   ErrorResponse:
 *     type: object
 *     properties:
 *       success:
 *         type: boolean
 *         example: false
 *       error:
 *         type: string
 *         description: Mensaje de error
 *       statusCode:
 *         type: integer
 *         description: Código de estado HTTP
 *       timestamp:
 *         type: string
 *         format: date-time
 *         description: Fecha y hora del error
 *       path:
 *         type: string
 *         description: Ruta donde ocurrió el error
 *       method:
 *         type: string
 *         description: Método HTTP
 *       details:
 *         type: object
 *         description: Detalles adicionales del error
 *       requestId:
 *         type: string
 *         description: ID único de la solicitud para seguimiento
 */

export const errorHandler = (
    err: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let { statusCode = 500, message } = err;
    
    // Generar ID único para la solicitud
    const requestId = req.headers['x-request-id'] || 
                     `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Log del error con información detallada
    console.error(`[ERROR] ${new Date().toISOString()} | RequestID: ${requestId}`, {
        error: err.name,
        message: err.message,
        stack: err.stack,
        statusCode,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        details: err.details
    });

    // No exponer detalles de errores internos en producción
    if (process.env.NODE_ENV === 'production' && !err.isOperational) {
        statusCode = 500;
        message = 'Error interno del servidor';
    }

    // Respuesta de error estandarizada
    const errorResponse = {
        success: false,
        error: message,
        statusCode,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        requestId,
        ...(err.details && { details: err.details })
    };

    res.status(statusCode).json(errorResponse);
};

// Middleware para capturar errores asíncronos
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware para manejar rutas no encontradas
export const notFoundHandler = (req: Request, res: Response) => {
    const requestId = req.headers['x-request-id'] || 
                     `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        statusCode: 404,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        requestId
    });
};

// Middleware de validación de errores
export const validationErrorHandler = (errors: any[]) => {
    return new AppError(
        'Error de validación',
        400,
        errors.map(err => ({
            field: err.param || err.field,
            message: err.msg || err.message,
            value: err.value
        }))
    );
};