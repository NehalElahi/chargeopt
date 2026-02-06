# ChargeOpt - EV Charging Optimization Platform

## Overview
ChargeOpt is a fullstack EV charging optimization application that helps users minimize charging costs by analyzing solar production, grid electricity prices, and battery status. It generates hour-by-hour charging schedules and tracks weekly savings.

## Architecture
- **Frontend**: React + Vite + TypeScript, Tailwind CSS, shadcn/ui components, Recharts for charts
- **Backend**: Express.js + TypeScript, Drizzle ORM with PostgreSQL
- **Auth**: Replit Auth (OIDC) for email-based login/logout
- **Routing**: wouter (frontend), Express routes (backend)

## Project Structure
```
shared/
  schema.ts          - Drizzle DB schema + Zod types (profiles, car models, optimization runs)
  routes.ts          - API route definitions and input/output schemas
  models/auth.ts     - Replit Auth tables (sessions, users)
server/
  routes.ts          - Express API endpoints (auth-protected)
  storage.ts         - Database CRUD operations (IStorage interface)
  services/
    decision_engine.ts   - Core optimization algorithm (ported from Python)
    solar_service.ts     - Solar production forecasting
    grid_service.ts      - Grid price forecasting (TOU rates)
    external_api.ts      - Weather data from Open-Meteo
  replit_integrations/auth/ - Replit Auth setup
client/src/
  App.tsx            - Root with auth gating (Landing vs AuthenticatedApp)
  pages/
    Landing.tsx      - Public landing page with sign-in
    Dashboard.tsx    - Optimization input form + results display
    Settings.tsx     - Profile config (location, solar, EV, battery)
    Savings.tsx      - Weekly savings chart + optimization history
  components/
    Sidebar.tsx      - Navigation sidebar + mobile bottom nav
    OptimizationResults.tsx - Charts and step table for optimization output
    WeatherCard.tsx  - Weather display widget
  hooks/
    use-auth.ts      - Auth state hook (Replit Auth)
    use-user.ts      - Profile, car models, savings hooks
    use-optimization.ts - Optimization mutation hook
    use-weather.ts   - Weather data hook
```

## Key Features
- **Replit Auth**: Login/logout via email; landing page shown for unauthenticated users
- **Geolocation**: Browser API to auto-detect latitude/longitude in Settings
- **Car Model Database**: 24 pre-seeded EV models (Tesla, Ford, Hyundai, etc.) with battery specs
- **Optimization Engine**: Analyzes solar forecast, grid prices, and battery state to plan charging
- **Weekly Savings Dashboard**: Bar chart of savings + optimization history table

## Database Tables
- `users` (Replit Auth) - auth user records
- `sessions` (Replit Auth) - session storage
- `user_profiles` - user settings (location, solar, EV, battery config)
- `ev_car_models` - reference table of EV models with specs
- `optimization_runs` - history of optimization results for savings tracking

## Recent Changes
- 2026-02-06: Initial build with auth, car models, geolocation, optimization, and savings tracking

## User Preferences
- Eco-friendly green color palette
- DM Sans / Outfit fonts
- Clean, information-dense dashboard layout
