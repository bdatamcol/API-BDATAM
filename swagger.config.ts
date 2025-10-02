import swaggerAutogen from "swagger-autogen";
import { envs } from "./src/config/envs";

const outputFile = "./swagger-output.json";
const endpointsFiles = [
  "./src/app.ts",
  "./src/routes/inventory.routes.ts",
  "./src/routes/auth.routes.ts",
  "./src/routes/invoice.routes.ts",
  "./src/routes/products.routes.ts",
  "./src/routes/sync.routes.ts"
];

const doc = {
  info: {
    title: "API BDATAM",
    description: "API profesional para consultar inventario, facturación y comparativas de empresas con autenticación JWT y API Key",
    version: "1.0.0",
  },
  host: envs.hostApi.replace('http://', '').replace('https://', ''),
  basePath: "/",
  schemes: ["http", "https"],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      in: "header",
      name: "Authorization",
      description: "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\""
    },
    apiKey: {
      type: "apiKey",
      in: "header",
      name: "X-API-Key",
      description: "API Key para acceso de servicios externos. Example: \"X-API-Key: {api_key}\""
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  definitions: {
    LoginRequest: {
      username: "admin",
      password: "Bdatam2025!"
    },
    AuthResponse: {
      success: true,
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      expiresIn: "24h",
      user: {
        username: "admin",
        role: "admin"
      }
    },
    ErrorResponse: {
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "Mensaje de error" },
        code: { type: "string", example: "ERROR_CODE" },
        details: { type: "object", additionalProperties: true }
      },
      required: ["success", "message"]
    },
    ValidationError: {
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "Error de validación" },
        code: { type: "string", example: "VALIDATION_ERROR" },
        errors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: { type: "string", example: "campo" },
              message: { type: "string", example: "Mensaje de error del campo" }
            }
          }
        }
      },
      required: ["success", "message", "errors"]
    }
  }
};

swaggerAutogen()(outputFile, endpointsFiles, doc);