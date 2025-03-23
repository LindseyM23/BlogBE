const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const userRoutes = require('./routes/userRoutes'); // Fix path
const postRoutes = require('./routes/postRoutes'); // Fix path
const commentRoutes = require('./routes/commentRoutes'); // Fix path
const resetRoutes = require('./routes/resetRoutes'); // Fix path
const db = require('./db');
require('dotenv').config();

console.log('Environment variables:', {
  PORT: process.env.PORT,
  API_BASE_URL: process.env.API_BASE_URL,
  JWT_SECRET: process.env.JWT_SECRET
});

const app = express();

app.use(express.json());
app.use('/uploads', express.static('uploads'));

const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Blog API', version: '1.0.0', description: 'API for a simple blog application' },
    servers: [{ url: process.env.API_BASE_URL }],
  },
  apis: ['./routes/*.js'], // Fix path for Swagger
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/reset', resetRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API docs available at ${process.env.API_BASE_URL}/api-docs`);
});