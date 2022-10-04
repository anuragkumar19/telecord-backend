import { Router } from 'express'
import { router as authRouter } from './api/auth.routes'

export const router = Router()

router.use('/auth', authRouter)
