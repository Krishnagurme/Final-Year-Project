/**
 * Role-based route protection middleware
 * Checks user role and grants/denies access to protected routes
 */

/**
 * Check if user has specific role
 */
export const hasRole = allowedRoles => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (!Array.isArray(allowedRoles)) {
        allowedRoles = [allowedRoles];
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
          requiredRoles: allowedRoles,
          userRole: req.user.role,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Authorization error' });
    }
  };
};

/**
 * Student-only protection
 */
export const isStudent = (req, res, next) => {
  return hasRole('Student')(req, res, next);
};

/**
 * Admin-only protection
 */
export const isAdmin = (req, res, next) => {
  return hasRole('Admin')(req, res, next);
};

/**
 * Owner-only protection (user can only access their own data)
 */
export const isOwner = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.params.userId || req.body.userId;

    if (req.user.userId.toString() !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({
        message: 'You can only access your own data',
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error' });
  }
};

/**
 * Combined role hierarchy check
 * Admin > Instructor > Student
 */
export const hasMinimumRole = minimumRole => {
  const roleHierarchy = {
    Admin: 3,
    Instructor: 2,
    Student: 1,
  };

  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userRoleLevel = roleHierarchy[req.user.role] || 0;
      const minimumRoleLevel = roleHierarchy[minimumRole] || 0;

      if (userRoleLevel < minimumRoleLevel) {
        return res.status(403).json({
          message: `Minimum role required: ${minimumRole}`,
          userRole: req.user.role,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Authorization error' });
    }
  };
};

export default {
  hasRole,
  isStudent,
  isAdmin,
  isOwner,
  hasMinimumRole,
};
