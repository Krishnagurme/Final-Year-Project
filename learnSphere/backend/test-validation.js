import Joi from 'joi';

const passwordSchema = Joi.string()
  .min(8)
  .pattern(/[A-Z]/)
  .pattern(/[a-z]/)
  .pattern(/[0-9]/)
  .pattern(/[!@#$%^&*]/)
  .required();

const registerSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: passwordSchema,
  role: Joi.string().valid('STUDENT', 'INSTRUCTOR', 'ADMIN').default('STUDENT'),
}).unknown(false);

const testData = {
  firstName: "John",
  lastName: "Doe", 
  email: "test@example.com",
  password: "Test123!@#",
  role: "STUDENT"
};

console.log('Test data:', testData);
console.log('Password validation:', passwordSchema.validate(testData.password));
console.log('Full validation:', registerSchema.validate(testData));

const { error, value } = registerSchema.validate(testData);
if (error) {
  console.log('Validation errors:', error.details);
} else {
  console.log('Validation passed!');
}
