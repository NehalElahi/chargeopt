import type { Express } from "express";
import passport from "passport";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { User } from "@shared/models/auth";
import { authStorage } from "./storage";
import { isAuthenticated } from "./localAuth";

const registerBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string(),
});

function publicUser(user: User) {
  const { passwordHash: _p, ...rest } = user;
  return rest;
}

export function registerAuthRoutes(app: Express): void {
  app.post("/api/register", async (req, res, next) => {
    try {
      const parsed = registerBody.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        });
      }
      const { email, password, firstName, lastName } = parsed.data;
      const existing = await authStorage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await authStorage.createUser({
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
      });
      req.login({ id: user.id }, (err) => {
        if (err) return next(err);
        res.json(publicUser(user));
      });
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/login", (req, res, next) => {
    const parsed = loginBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      });
    }
    passport.authenticate("local", (err: Error | null, user: { id: string } | false) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      req.logIn(user, async (err2) => {
        if (err2) return next(err2);
        try {
          const full = await authStorage.getUser(user.id);
          if (!full) return res.status(500).json({ message: "Login failed" });
          res.json(publicUser(full));
        } catch (e) {
          next(e);
        }
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as { id: string }).id;
      const user = await authStorage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      res.json(publicUser(user));
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
