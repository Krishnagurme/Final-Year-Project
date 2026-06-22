import express from 'express';
import { authService } from '../services/auth.service.js';
import { validateRequest, schemas, sanitizeRequest } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { strictRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

/**
 * Register new user
 * POST /auth/register
 */
router.post(
  '/register',
  strictRateLimit,
  sanitizeRequest,
  validateRequest(schemas.register),
  async (req, res) => {
    try {
      const result = await authService.register(req.validated);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        message: 'User registered successfully',
        data: {
          user: result.user,
          token: result.accessToken,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * Login user
 * POST /auth/login
 */
router.post(
  '/login',
  strictRateLimit,
  sanitizeRequest,
  validateRequest(schemas.login),
  async (req, res) => {
    try {
      const result = await authService.login(req.validated.email, req.validated.password);

      // Set refresh token in httpOnly cookie for security
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        message: 'Login successful',
        data: {
          user: result.user,
          token: result.accessToken,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }
);

/**
 * Refresh access token using refresh token
 * POST /auth/refresh-token
 */
router.post('/refresh-token', sanitizeRequest, async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const tokens = authService.refreshAccessToken(refreshToken);

    // Update cookie with new refresh token
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

/**
 * Change password
 * POST /auth/change-password
 */
router.post(
  '/change-password',
  authenticate,
  sanitizeRequest,
  validateRequest(schemas.changePassword),
  async (req, res) => {
    try {
      await authService.changePassword(
        req.user.userId,
        req.validated.oldPassword,
        req.validated.newPassword
      );

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * Logout user
 * POST /auth/logout
 */
router.post('/logout', authenticate, (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
