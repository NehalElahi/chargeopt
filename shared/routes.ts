import { z } from 'zod';
import { 
  insertUserSchema, 
  users, 
  optimizeRequestSchema, 
  decisionOutcomeSchema,
  externalDataSchema,
  solarForecastSeriesSchema,
  priceForecastSchema
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  users: {
    get: {
      method: 'GET' as const,
      path: '/api/user' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/user' as const,
      input: insertUserSchema.partial(),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  },
  weather: {
    get: {
      method: 'GET' as const,
      path: '/api/weather' as const,
      input: z.object({
        lat: z.coerce.number(),
        lon: z.coerce.number(),
      }),
      responses: {
        200: externalDataSchema,
        502: errorSchemas.internal,
      },
    },
  },
  optimize: {
    run: {
      method: 'POST' as const,
      path: '/api/optimize' as const,
      input: optimizeRequestSchema,
      responses: {
        200: decisionOutcomeSchema,
        400: errorSchemas.validation,
      },
    },
  },
  forecast: {
    solar: {
      method: 'GET' as const,
      path: '/api/forecast/solar' as const,
      input: z.object({
        lat: z.coerce.number(),
        lon: z.coerce.number(),
        system_kw: z.coerce.number(),
      }),
      responses: {
        200: solarForecastSeriesSchema,
      }
    },
    prices: {
      method: 'GET' as const,
      path: '/api/forecast/prices' as const,
      input: z.object({
        lat: z.coerce.number(),
        lon: z.coerce.number(),
      }),
      responses: {
        200: priceForecastSchema,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
