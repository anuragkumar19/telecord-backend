import { Router } from 'express'
import { UploadType } from '../../constants'
import {
    createStatusWithImage,
    createStatusWithVideo,
    getMyStatus,
    getStatusOfAUser,
    getStatusOfFriends,
    markStatusSeen,
} from '../../controllers/status.controller'
import { authGuard } from '../../middleware/auth.middleware'
import { upload } from '../../middleware/upload.middleware'
import { validate, validateParams } from '../../middleware/validate.middleware'
import { createStatusSchema } from '../../validations/UserInputSchema'

export const router = Router()

// Allow authenticated users only
router.use(authGuard)

router.get('/friends', getStatusOfFriends)
router.get('/me', getMyStatus)

router.post(
    '/image',
    upload(UploadType.IMAGE, 'image', 10 * 1024 * 1024), // 10 mb
    validate(createStatusSchema),
    createStatusWithImage
)
router.post(
    '/video',
    upload(UploadType.VIDEO, 'video', 100 * 1024 * 1024), // 100 mb
    validate(createStatusSchema),
    createStatusWithVideo
)
router.post('/:id', validateParams('id'), markStatusSeen)
router.get('/user/:id', validateParams('id'), getStatusOfAUser)
