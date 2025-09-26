import swaggerAutogen from "swagger-autogen";
import { envs } from "./src/config/envs";

const outputFile = "./swagger-output.json";
const endpointsFiles = [
  "./src/app.ts",
  "./src/routes/inventory.routes.ts"
];

const doc = {
  info: {
    title: "API BDATAM",
    description: "API para consultar inventario, facturación y comparativas de las empresas",
  },
  host: envs.hostApi || "localhost:3000",
  schemes: ["http"],
};

swaggerAutogen()(outputFile, endpointsFiles, doc);