import { Router } from 'express'
import { router as authRouter } from './api/auth.routes'
import { router as userRouter } from './api/user.routes'
import { router as statusRouter } from './api/status.routes'
import { router as threadRouter } from './api/thread.routes'

export const router = Router()

router.use('/auth', authRouter)
router.use('/user', userRouter)
router.use('/status', statusRouter)
router.use('/thread', threadRouter)
