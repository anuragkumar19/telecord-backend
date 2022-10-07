import { Router } from 'express'
import { authGuard } from '../../middleware/auth.middleware'

export const router = Router()

// Allow authenticated users only
router.use(authGuard)
