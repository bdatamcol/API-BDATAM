import swaggerAutogen from "swagger-autogen";
import { envs } from "./src/config/envs";

const outputFile = "./swagger-output.json";
const endpointsFiles = [
  "./src/app.ts",
  "./src/routes/inventory.routes.ts"
];

// Detectar entorno
const isProd = process.env.NODE_ENV === "production";

// Detectar si host es localhost o IP privada
const isLocal =
  envs.hostApi.includes("localhost") ||
  /^10\./.test(envs.hostApi) ||
  /^192\.168\./.test(envs.hostApi) ||
  /^127\./.test(envs.hostApi);

const doc = {
  info: {
    title: "API BDATAM",
    description: "API para consultar inventario, facturación y comparativas de las empresas",
  },
  host: envs.hostApi,
  schemes: isProd
    ? ["https"] // solo https en producción
    : isLocal
      ? ["http"] // solo http en local/red
      : ["http", "https"], // fallback mixto
};

swaggerAutogen()(outputFile, endpointsFiles, doc);