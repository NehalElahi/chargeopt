import { z } from 'zod';
import {
  insertUserProfileSchema,
  optimizeRequestSchema,
  decisionOutcomeSchema,
  externalDataSchema,
  solarForecastSeriesSchema,
  priceForecastSchema,
  evCarModels,
  userProfiles,
  optimizationRuns
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
  profile: {
    get: {
      method: 'GET' as const,
      path: '/api/profile' as const,
      responses: {
        200: z.custom<typeof userProfiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/profile' as const,
      input: insertUserProfileSchema.partial(),
      responses: {
        200: z.custom<typeof userProfiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  },
  carModels: {
    list: {
      method: 'GET' as const,
      path: '/api/car-models' as const,
      responses: {
        200: z.array(z.custom<typeof evCarModels.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/car-models/:id' as const,
      responses: {
        200: z.custom<typeof evCarModels.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
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
    confirm: {
      method: 'POST' as const,
      path: '/api/optimize/confirm' as const,
      input: z.object({
        netCost: z.number(),
        savingsVsAllGrid: z.number(),
        totalGridKwh: z.number(),
        totalSolarUsedKwh: z.number(),
        totalExportKwh: z.number(),
        recommendation: z.string(),
        explanation: z.string(),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
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
  },
  savings: {
    weekly: {
      method: 'GET' as const,
      path: '/api/savings/weekly' as const,
      responses: {
        200: z.array(z.object({
          week: z.string(),
          savings: z.number(),
          runs: z.number(),
        })),
      }
    },
    history: {
      method: 'GET' as const,
      path: '/api/savings/history' as const,
      responses: {
        200: z.array(z.custom<typeof optimizationRuns.$inferSelect>()),
      }
    },
    reset: {
      method: 'DELETE' as const,
      path: '/api/savings' as const,
      responses: {
        200: z.object({ success: z.boolean(), deleted: z.number() }),
      }
    },
    deleteLast: {
      method: 'DELETE' as const,
      path: '/api/savings/last' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
      }
    },
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
