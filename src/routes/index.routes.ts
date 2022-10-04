import { Router } from 'express'
import { router as apiRouter } from './api.routes'

export const router = Router()

router.use('/api/v1', apiRouter)
