import Joi from 'joi';

/**
 * Enhanced input validation middleware
 */
export const validateRequest = schema => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      presence: 'required',
    });

    if (error) {
      const errors = {};
      error.details.forEach(detail => {
        errors[detail.path[0]] = detail.message;
      });
      return res.status(400).json({
        message: 'Validation failed',
        errors,
      });
    }

    req.validated = value;
    next();
  };
};

/**
 * Sanitize request body to prevent XSS
 */
export const sanitizeRequest = (req, res, next) => {
  const sanitizeValue = value => {
    if (typeof value === 'string') {
      return value
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return Object.keys(value).reduce((acc, key) => {
        acc[key] = sanitizeValue(value[key]);
        return acc;
      }, {});
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  next();
};

/**
 * Password strength validator
 */
const passwordSchema = Joi.string()
  .min(8)
  .pattern(/[A-Z]/)
  .pattern(/[a-z]/)
  .pattern(/[0-9]/)
  .pattern(/[!@#$%^&*]/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base':
      'Password must contain uppercase, lowercase, number, and special character',
  });

/**
 * Joi validation schemas with enhanced rules
 */
export const schemas = {
  register: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: passwordSchema,
    role: Joi.string().valid('STUDENT', 'ADMIN').default('STUDENT'),
  }).unknown(false),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }).unknown(false),

  changePassword: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: passwordSchema,
    confirmPassword: Joi.any()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({ 'any.only': 'Passwords must match' }),
  }).unknown(false),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }).unknown(false),

  createCourse: Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).max(1000).required(),
    category: Joi.string().required(),
    subject: Joi.string().optional(),
    level: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED').required(),
    learningOutcomes: Joi.array().items(Joi.string().min(5)),
    instructor: Joi.string().required(),
  }).unknown(false),

  submitAssessment: Joi.object({
    courseId: Joi.string().length(24).hex().required(),
    subject: Joi.string().required(),
    answers: Joi.array()
      .items(
        Joi.object({
          questionId: Joi.string().required(),
          studentAnswer: Joi.string().required(),
          isCorrect: Joi.boolean().required(),
        })
      )
      .min(1)
      .required(),
  }).unknown(false),

  evaluatePrerequisites: Joi.object({
    subject: Joi.string().required(),
    answers: Joi.array()
      .items(
        Joi.object({
          questionId: Joi.string().required(),
          question: Joi.string().optional(),
          topic: Joi.string().optional(),
          studentAnswer: Joi.string().required(),
          correctAnswer: Joi.string().optional(),
          isCorrect: Joi.boolean().required(),
        })
      )
      .min(1)
      .required(),
    courseLevel: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED').default('INTERMEDIATE'),
    courseId: Joi.string().length(24).hex().optional(),
  }).unknown(false),

  generateTest: Joi.object({
    numberOfQuestions: Joi.number().min(1).max(50).default(5),
  }).unknown(false),

  generateLearningPath: Joi.object({
    studentProfile: Joi.object({
      skillLevel: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED').required(),
      prerequisites: Joi.array().items(Joi.string()).default([]),
      learningStyle: Joi.string().optional(),
      hoursPerWeek: Joi.number().min(1).max(168).default(10),
    }).required(),
    courseId: Joi.string().length(24).hex().required(),
    assessmentResults: Joi.object().optional(),
  }).unknown(false),

  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),
    hoursPerWeek: Joi.number().min(0).max(168),
    learningStyle: Joi.string().valid('Visual', 'Auditory', 'Reading', 'Kinesthetic'),
    preferredPace: Joi.string().valid('Slow', 'Medium', 'Fast'),
  }).unknown(false),
};
