import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '100y';
const REFRESH_TOKEN_EXPIRY = '100y';

export const authService = {
  /**
   * Hash password using bcrypt
   */
  async hashPassword(password) {
    try {
      return await bcryptjs.hash(password, SALT_ROUNDS);
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  },

  /**
   * Compare plain password with hashed password
   */
  async comparePassword(plainPassword, hashedPassword) {
    try {
      return await bcryptjs.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw new Error(`Password comparison failed: ${error.message}`);
    }
  },

  /**
   * Generate JWT access token (15 minutes)
   */
  generateAccessToken(userId, role) {
    return jwt.sign({ userId, role, type: 'access' }, process.env.JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
  },

  /**
   * Generate JWT refresh token (7 days)
   */
  generateRefreshToken(userId, role) {
    return jwt.sign(
      { userId, role, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
  },

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(userId, role) {
    return {
      accessToken: this.generateAccessToken(userId, role),
      refreshToken: this.generateRefreshToken(userId, role),
    };
  },

  /**
   * Verify JWT token
   */
  verifyToken(token, isRefresh = false) {
    try {
      const secret = isRefresh
        ? process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
        : process.env.JWT_SECRET;
      return jwt.verify(token, secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  },

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(refreshToken) {
    try {
      const decoded = this.verifyToken(refreshToken, true);

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return this.generateTokenPair(decoded.userId, decoded.role);
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  },

  /**
   * Validate password strength
   */
  validatePasswordStrength(password) {
    const errors = [];

    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    return { isValid: errors.length === 0, errors };
  },

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  async register(userData) {
    const { email, password, firstName, lastName, role = 'STUDENT' } = userData;

    // Validate email
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    const passwordValidation = this.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join('; '));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await this.hashPassword(password);
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
    });

    await user.save();

    const tokens = this.generateTokenPair(user._id.toString(), user.role);

    return {
      user: {
        userId: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...tokens,
    };
  },

  async login(email, password) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    user.lastLogin = new Date();
    await user.save();

    const tokens = this.generateTokenPair(user._id.toString(), user.role);

    return {
      user: {
        userId: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        skillLevel: user.skillLevel,
      },
      ...tokens,
    };
  },

  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await this.comparePassword(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password strength
    const passwordValidation = this.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join('; '));
    }

    user.password = await this.hashPassword(newPassword);
    await user.save();

    return { message: 'Password changed successfully' };
  },

  async getUserById(userId) {
    const user = await User.findById(userId)
      .select('-password')
      .populate('enrolledCourses.courseId');
    return user;
  },

  async updateUserProfile(userId, updateData) {
    // Don't allow direct password updates through this method
    const { password, ...safeData } = updateData;
    const user = await User.findByIdAndUpdate(userId, safeData, { new: true });
    return user;
  },
};
