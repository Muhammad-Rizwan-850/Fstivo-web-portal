import { createSwaggerSpec } from 'next-swagger-doc';

const apiDirectory = './src/app/api';
const projectRoot = './';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fstivo API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the Fstivo event management platform',
      contact: {
        name: 'Fstivo Support',
        email: 'support@fstivo.com',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://fstivo.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            full_name: { type: 'string' },
            avatar_url: { type: 'string', format: 'uri' },
            role: { type: 'string', enum: ['attendee', 'organizer', 'admin'] },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            start_date: { type: 'string', format: 'date-time' },
            end_date: { type: 'string', format: 'date-time' },
            venue_name: { type: 'string' },
            venue_city: { type: 'string' },
            capacity: { type: 'integer' },
            price: { type: 'number' },
            status: { type: 'string', enum: ['draft', 'published', 'cancelled'] },
            organizer_id: { type: 'string' },
          },
        },
        Registration: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            user_id: { type: 'string' },
            event_id: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'attended', 'cancelled'] },
            qr_code: { type: 'string' },
            registration_number: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apiFolder: apiDirectory,
  schemaFolders: ['./src/lib/types'],
};

export const getApiDocs = () => createSwaggerSpec(options);