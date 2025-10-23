/**
 * Auth Validation Schemas
 * 
 * Zod schemas for validating authentication forms
 */

import { z } from 'zod';

// Email validation schema
export const EmailSchema = z.string()
  .min(1, { message: "Email is required" })
  .email({ message: "Please enter a valid email address" });

// Password validation for login (basic)
export const PasswordLoginSchema = z.string()
  .min(1, { message: "Password is required" });

// Password validation for registration (more strict)
export const PasswordRegisterSchema = z.string()
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" });

// Login form schema
export const LoginFormSchema = z.object({
  email: EmailSchema,
  password: PasswordLoginSchema,
});

// Registration form schema
export const RegisterFormSchema = z.object({
  email: EmailSchema,
  password: PasswordRegisterSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});

// Reset password form schema
export const ResetPasswordFormSchema = z.object({
  password: PasswordRegisterSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});

// Type inference
export type LoginFormValues = z.infer<typeof LoginFormSchema>;
export type RegisterFormValues = z.infer<typeof RegisterFormSchema>;
export type ResetPasswordFormValues = z.infer<typeof ResetPasswordFormSchema>;
