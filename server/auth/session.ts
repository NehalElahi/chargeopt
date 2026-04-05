import session from "express-session";
import connectPg from "connect-pg-simple";
import { resolveDatabaseUrlToIpv4 } from "../resolve-db-url";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: resolveDatabaseUrlToIpv4(process.env.DATABASE_URL!),
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  const crossSite = !!process.env.FRONTEND_ORIGIN;
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: crossSite ? "none" : "lax",
      maxAge: sessionTtl,
    },
  });
}
