import { Router } from 'express'
import { UploadType } from '../../constants'
import {
    addSecondaryEmail,
    blockUser,
    getBlockedUsers,
    getFriendsDetail,
    getLoggedInUser,
    getOtpForSecondaryEmail,
    getUser,
    makeSecondaryEmailPrimary,
    removeSecondaryEmail,
    searchUser,
    sendOrAcceptRequest,
    unblockUser,
    unfriendOrCancelFriendRequest,
    updateAccountPrivacy,
    updateBio,
    updateName,
    updatePassword,
    updateSecondaryEmail,
    updateUsername,
    uploadAvatar,
    verifySecondaryEmail,
} from '../../controllers/user.controller'
import { authGuard, verifyPassword } from '../../middleware/auth.middleware'
import { upload } from '../../middleware/upload.middleware'
import { validate, validateParams } from '../../middleware/validate.middleware'
import {
    accountPrivacySchema,
    secondaryEmailSchema,
    updateBioSchema,
    updateNameSchema,
    updatePasswordSchema,
    updateUsernameSchema,
    verifySecondaryEmailSchema,
} from '../../validations/UserInputSchema'

export const router = Router()

// Allow authenticated users only
router.use(authGuard)

router.get('/me', getLoggedInUser)
router.get('/friends', getFriendsDetail)

router.put('/name', validate(updateNameSchema), updateName)
router.put('/username', validate(updateUsernameSchema), updateUsername)
router.put('/bio', validate(updateBioSchema), updateBio)
router.put('/password', validate(updatePasswordSchema), updatePassword)
router.put(
    '/avatar',
    upload(
        UploadType.IMAGE,
        'avatar',
        5 * 1024 * 1024, // 5MB
        false
    ),
    uploadAvatar
)
router.put('/email', verifyPassword(), makeSecondaryEmailPrimary)
router.put(
    '/account-privacy',
    validate(accountPrivacySchema),
    updateAccountPrivacy
)

router
    .route('/secondary-email')
    .post(validate(secondaryEmailSchema), addSecondaryEmail)
    .put(validate(secondaryEmailSchema), updateSecondaryEmail)
    .delete(removeSecondaryEmail)
router.post('/secondary-email/otp', getOtpForSecondaryEmail)
router.post(
    '/secondary-email/verify',
    validate(verifySecondaryEmailSchema),
    verifySecondaryEmail
)

router.get('/search', searchUser)
router.get('/blocked', getBlockedUsers)

router
    .route('/:id')
    .get(validateParams('id'), getUser)
    .post(validateParams('id'), sendOrAcceptRequest)
    .delete(validateParams('id'), unfriendOrCancelFriendRequest)

router.post('/:id/block', validateParams('id'), blockUser)
router.post('/:id/unblock', validateParams('id'), unblockUser)
