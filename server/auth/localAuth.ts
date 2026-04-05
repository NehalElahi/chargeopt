import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import type { Express, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { getSession } from "./session";
import { authStorage } from "./storage";

declare global {
  namespace Express {
    interface User {
      id: string;
    }
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const user = await authStorage.getUserByEmail(email);
          if (!user?.passwordHash) {
            return done(null, false);
          }
          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return done(null, false);
          return done(null, { id: user.id });
        } catch (e) {
          return done(e as Error);
        }
      },
    ),
  );

  passport.serializeUser((user: Express.User, cb) => cb(null, user.id));
  passport.deserializeUser(async (id: string, cb) => {
    try {
      const user = await authStorage.getUser(id);
      if (!user) return cb(null, false);
      cb(null, { id: user.id });
    } catch (e) {
      cb(e as Error, false);
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && (req.user as Express.User)?.id) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
