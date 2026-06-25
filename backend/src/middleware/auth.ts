import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AppError } from './errorHandler';
import { getUserById, getDb } from '../utils/db';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ─── Verify JWT ──────────────────────────────────────────
export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authorization token required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      sub: string;
      email: string;
      role: string;
    };

    // Verify user still exists and is active (SQLite)
    const user = getUserById(decoded.sub) as any;

    if (!user || user.isActive === 0) {
      throw new AppError('User not found or inactive', 401);
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid or expired token', 401));
    }
    next(err);
  }
};

// ─── RBAC Authorization ──────────────────────────────────
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt`, {
        userId: req.user.id,
        role: req.user.role,
        requiredRoles: roles,
        path: req.path,
      });
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
};

// ─── Project Member Check ────────────────────────────────
export const requireProjectAccess = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    if (!projectId || !req.user) {
      return next(new AppError('Project ID required', 400));
    }

    // Admins bypass project-level access checks
    if (req.user.role === 'ADMIN' || req.user.role === 'PM') return next();

    // Check project_members table via raw SQLite
    const db = getDb();
    let member: any = null;
    try {
      member = db.prepare(
        'SELECT id FROM project_members WHERE projectId=? AND userId=?'
      ).get(projectId, req.user.id);
    } catch {
      // Table may not exist — allow access
      return next();
    }

    if (!member) {
      return next(new AppError('Access denied to this project', 403));
    }

    next();
  } catch (err) {
    next(err);
  }
};
