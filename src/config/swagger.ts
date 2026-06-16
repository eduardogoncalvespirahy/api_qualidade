import swaggerAutogen from 'swagger-autogen';
import dotenv from "dotenv";

dotenv.config();

const HOST = String(process.env.HOST);
const PORT = Number(process.env.PORT);

const doc = {
  info: {
    version: 'v1.0.0',
    title: 'API Node.js Backend Qualidade',
    description: 'Api Nodejs Backend Qualidade com TypeScript, Express e Redis',
  },
  host: `${HOST}:${PORT}`,
  basePath: '/',
  schemes: ['http', 'https'],
};

const outputFile = '../../swagger-output.json';
const endpointsFiles = ['src/routes/index.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc);