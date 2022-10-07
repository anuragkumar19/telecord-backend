import Joi = require('joi')
import { Permissions } from '../constants'

const PermissionScope = Object.values(Permissions)

const name = Joi.string().required()
const email = Joi.string().email().required()
const username = Joi.string().alphanum().required().min(3).max(50).lowercase()
const newPassword = Joi.string().min(8).required()
const password = Joi.string().required()
const otp = Joi.number().required().min(100000).max(999999)
const permissions = Joi.string()
    .trim()
    .lowercase()
    .valid(...PermissionScope)

// Username or Email
const identifierValidator: Joi.CustomValidator = (value, helpers) => {
    const result = email.validate(value)

    if (!result.error) {
        return result.value
    }

    const result2 = username.validate(value)

    if (!result2.error) {
        return result2.value
    }

    return helpers.error('any.custom', {
        message: 'Invalid username or email',
    })
}

export const registerSchema = Joi.object({
    name,
    email,
    username,
    password: newPassword,
})

export const verifyEmailSchema = Joi.object({
    email,
    otp,
})

export const resetPasswordSchema = Joi.object({
    email,
    otp,
    password: newPassword,
})

export const forgotPasswordSchema = Joi.object({
    email,
})

export const loginSchema = Joi.object({
    identifier: Joi.string().required().custom(identifierValidator),
    password,
})

export const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required(),
})

export const updateNameSchema = Joi.object({
    name,
})

export const updateUsernameSchema = Joi.object({
    username,
})

export const secondaryEmailSchema = Joi.object({
    email,
})

export const updatePasswordSchema = Joi.object({
    oldPassword: password,
    newPassword: newPassword,
})

export const updateBioSchema = Joi.object({
    bio: Joi.string().max(200).allow(''),
})

export const verifySecondaryEmailSchema = Joi.object({
    otp,
})

export const passwordVerifySchema = Joi.object({
    password,
})

export const accountPrivacySchema = Joi.object({
    whoCanSeeBio: permissions,
    whoCanSeeActiveStatus: permissions,
    whoCanSeeAvatar: permissions,
    whoCanSeeLastSeen: permissions,
    whoCanSeeStatus: permissions,
    whoCanSendYouMessage: Joi.string()
        .trim()
        .lowercase()
        .valid(Permissions.EVERYONE, Permissions.FRIENDS),
})

export const createStatusSchema = Joi.object({
    caption: Joi.string().trim().max(500),
})
