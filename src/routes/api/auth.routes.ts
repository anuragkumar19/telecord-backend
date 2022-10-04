import { Router } from 'express'
import {
    forgotPassword,
    login,
    refreshToken,
    register,
    resetPassword,
    verifyEmail,
} from '../../controllers/auth.controller'
import { validate } from '../../middleware/validate.middleware'
import {
    forgotPasswordSchema,
    loginSchema,
    refreshTokenSchema,
    registerSchema,
    resetPasswordSchema,
    verifyEmailSchema,
} from '../../validations/UserInputSchema'

export const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail)
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword)
router.post('/reset-password', validate(resetPasswordSchema), resetPassword)
router.post('/login', validate(loginSchema), login)
router.post('/refresh', validate(refreshTokenSchema), refreshToken)
