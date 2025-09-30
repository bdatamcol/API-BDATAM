import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

export interface ValidationRule {
    field: string;
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'email' | 'uuid' | 'date';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    custom?: (value: any) => boolean | string;
}

/**
 * @swagger
 * definitions:
 *   ValidationError:
 *     type: object
 *     properties:
 *       field:
 *         type: string
 *         description: Campo que falló la validación
 *       message:
 *         type: string
 *         description: Mensaje de error del campo
 *       value:
 *         type: string
 *         description: Valor proporcionado
 *       rule:
 *         type: string
 *         description: Regla de validación que falló
 */

export class ValidationMiddleware {
    
    static validate(rules: ValidationRule[], source: 'body' | 'query' | 'params' = 'body') {
        return (req: Request, res: Response, next: NextFunction) => {
            try {
                const data = req[source];
                const errors: any[] = [];

                rules.forEach(rule => {
                    const value = data[rule.field];
                    
                    // Validación de campo requerido
                    if (rule.required && (value === undefined || value === null || value === '')) {
                        errors.push({
                            field: rule.field,
                            message: `El campo ${rule.field} es requerido`,
                            value,
                            rule: 'required'
                        });
                        return;
                    }

                    // Si no es requerido y no hay valor, saltar validaciones
                    if (!rule.required && (value === undefined || value === null || value === '')) {
                        return;
                    }

                    // Validación de tipo
                    if (rule.type) {
                        const typeError = this.validateType(value, rule.field, rule.type);
                        if (typeError) {
                            errors.push(typeError);
                            return;
                        }
                    }

                    // Validación de longitud para strings
                    if (rule.type === 'string' && typeof value === 'string') {
                        if (rule.minLength && value.length < rule.minLength) {
                            errors.push({
                                field: rule.field,
                                message: `El campo ${rule.field} debe tener al menos ${rule.minLength} caracteres`,
                                value,
                                rule: 'minLength'
                            });
                        }
                        if (rule.maxLength && value.length > rule.maxLength) {
                            errors.push({
                                field: rule.field,
                                message: `El campo ${rule.field} debe tener máximo ${rule.maxLength} caracteres`,
                                value,
                                rule: 'maxLength'
                            });
                        }
                    }

                    // Validación de valores numéricos
                    if (rule.type === 'number' && typeof value === 'number') {
                        if (rule.min !== undefined && value < rule.min) {
                            errors.push({
                                field: rule.field,
                                message: `El campo ${rule.field} debe ser mayor o igual a ${rule.min}`,
                                value,
                                rule: 'min'
                            });
                        }
                        if (rule.max !== undefined && value > rule.max) {
                            errors.push({
                                field: rule.field,
                                message: `El campo ${rule.field} debe ser menor o igual a ${rule.max}`,
                                value,
                                rule: 'max'
                            });
                        }
                    }

                    // Validación de patrón
                    if (rule.pattern && !rule.pattern.test(value)) {
                        errors.push({
                            field: rule.field,
                            message: `El campo ${rule.field} no cumple con el formato requerido`,
                            value,
                            rule: 'pattern'
                        });
                    }

                    // Validación de enum
                    if (rule.enum && !rule.enum.includes(value)) {
                        errors.push({
                            field: rule.field,
                            message: `El campo ${rule.field} debe ser uno de: ${rule.enum.join(', ')}`,
                            value,
                            rule: 'enum'
                        });
                    }

                    // Validación personalizada
                    if (rule.custom) {
                        const customResult = rule.custom(value);
                        if (customResult !== true) {
                            errors.push({
                                field: rule.field,
                                message: typeof customResult === 'string' ? customResult : `El campo ${rule.field} no es válido`,
                                value,
                                rule: 'custom'
                            });
                        }
                    }
                });

                if (errors.length > 0) {
                    throw new AppError('Error de validación', 400, errors);
                }

                next();
            } catch (error) {
                next(error);
            }
        };
    }

    private static validateType(value: any, field: string, type: string): any {
        switch (type) {
            case 'string':
                if (typeof value !== 'string') {
                    return {
                        field,
                        message: `El campo ${field} debe ser una cadena de texto`,
                        value,
                        rule: 'type'
                    };
                }
                break;
            case 'number':
                if (typeof value !== 'number' || isNaN(value)) {
                    return {
                        field,
                        message: `El campo ${field} debe ser un número válido`,
                        value,
                        rule: 'type'
                    };
                }
                break;
            case 'boolean':
                if (typeof value !== 'boolean') {
                    return {
                        field,
                        message: `El campo ${field} debe ser verdadero o falso`,
                        value,
                        rule: 'type'
                    };
                }
                break;
            case 'email':
                if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return {
                        field,
                        message: `El campo ${field} debe ser un email válido`,
                        value,
                        rule: 'type'
                    };
                }
                break;
            case 'uuid':
                if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
                    return {
                        field,
                        message: `El campo ${field} debe ser un UUID válido`,
                        value,
                        rule: 'type'
                    };
                }
                break;
            case 'date':
                if (!this.isValidDate(value)) {
                    return {
                        field,
                        message: `El campo ${field} debe ser una fecha válida`,
                        value,
                        rule: 'type'
                    };
                }
                break;
        }
        return null;
    }

    private static isValidDate(value: any): boolean {
        const date = new Date(value);
        return date instanceof Date && !isNaN(date.getTime());
    }

    // Validadores comunes predefinidos
    static loginValidation = this.validate([
        {
            field: 'username',
            required: true,
            type: 'string',
            minLength: 3,
            maxLength: 50
        },
        {
            field: 'password',
            required: true,
            type: 'string',
            minLength: 6,
            maxLength: 100
        }
    ]);

    static paginationValidation = this.validate([
        {
            field: 'page',
            type: 'string',
            custom: (value) => {
                const num = parseInt(value, 10);
                if (isNaN(num) || num < 1) {
                    return 'La página debe ser un número válido mayor o igual a 1';
                }
                if (!Number.isInteger(num)) {
                    return 'La página debe ser un número entero';
                }
                return true;
            }
        },
        {
            field: 'limit',
            type: 'string',
            custom: (value) => {
                const num = parseInt(value, 10);
                if (isNaN(num) || num < 1) {
                    return 'El límite debe ser un número válido mayor o igual a 1';
                }
                if (!Number.isInteger(num)) {
                    return 'El límite debe ser un número entero';
                }
                if (num > 1000) {
                    return 'El límite máximo permitido es 1000';
                }
                return true;
            }
        },
        {
            field: 'ciudad',
            type: 'string',
            maxLength: 100,
            required: false
        },
        {
            field: 'empresa',
            type: 'string',
            maxLength: 100,
            required: false
        }
    ], 'query');
}