import swaggerAutogen from "swagger-autogen";

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
  host: "localhost:3000/api",
  schemes: ["http"],
};

swaggerAutogen()(outputFile, endpointsFiles, doc);