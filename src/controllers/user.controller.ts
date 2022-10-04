import crypto from 'crypto'
import { Handler } from 'express'
import expressAsyncHandler from 'express-async-handler'
import { SendOtpType } from '../constants'
import { User } from '../models/user.model'
import { sendOtp } from '../utils/email.util'
import { genOtp } from '../utils/otp.util'

export const getLoggedInUser: Handler = (req, res) => {
    const user = req.user!

    res.status(200).json({
        user: user.me(),
    })
}

export const updateName = expressAsyncHandler(async (req, res) => {
    const user = req.user!

    user.name = req.body.name
    await user.save()

    res.status(200).json({
        message: 'Name updated',
    })
})

export const updateUsername = expressAsyncHandler(async (req, res) => {
    const user = req.user!

    const { username } = req.body

    if (user.username === username) {
        res.status(400)
        throw new Error('Username is same as current username')
    }

    const existingUser = await User.findOne({ username })

    if (existingUser) {
        res.status(400)
        throw new Error('Username is already taken')
    }

    user.username = username

    await user.save()

    res.status(200).json({
        message: 'Username updated',
    })
})

export const updateBio = expressAsyncHandler(async (req, res) => {
    const user = req.user!

    user.bio = req.body.bio
    await user.save()

    res.status(200).json({
        message: 'Bio updated',
    })
})

export const updatePassword = expressAsyncHandler(async (req, res) => {
    const user = req.user!

    const { oldPassword, newPassword } = req.body

    if (!user.comparePassword(oldPassword)) {
        res.status(400)
        throw new Error('Incorrect password')
    }

    user.password = newPassword

    await user.save()

    res.status(200).json({
        message: 'Password updated',
    })
})

export const uploadAvatar = expressAsyncHandler(async (req, res) => {
    const user = req.user!
    const file = req.file!

    const path = file.path.replace(
        'https://res.cloudinary.com/instavite/image/upload/',
        'https://res.cloudinary.com/instavite/image/upload/c_fill,h_480,w_480/'
    )

    user.avatar = path

    await user.save()

    res.status(200).json({
        message: 'Avatar updated',
    })
})

export const addSecondaryEmail = expressAsyncHandler(async (req, res) => {
    const user = req.user!

    const { email } = req.body

    if (email === user.email) {
        res.status(400)
        throw new Error('Email is same as current email')
    }

    if (user.secondaryEmail) {
        res.status(400)
        throw new Error('Secondary email already exists')
    }

    const existingUser = await User.findOne({ email })

    if (existingUser) {
        res.status(400)
        throw new Error('Email is already taken')
    }

    user.secondaryEmail = email

    await user.save()

    res.status(200).json({
        message: 'Secondary email added',
    })
})

export const removeSecondaryEmail = expressAsyncHandler(async (req, res) => {
    const user = req.user!

    if (!user.secondaryEmail) {
        res.status(400)
        throw new Error('Secondary email does not exist')
    }

    user.secondaryEmail = undefined
    user.isSecondaryEmailVerified = false

    await user.save()

    res.status(200).json({
        message: 'Secondary email removed',
    })
})

export const updateSecondaryEmail = expressAsyncHandler(async (req, res) => {
    const user = req.user!

    if (!user.secondaryEmail) {
        res.status(400)
        throw new Error('Secondary email does not exist')
    }

    const { email } = req.body

    if (email === user.email) {
        res.status(400)
        throw new Error('Email is same as current email')
    }

    if (email === user.secondaryEmail) {
        res.status(400)
        throw new Error('Email is same as secondary email')
    }

    const existingUser = await User.findOne({ email })

    if (existingUser) {
        res.status(400)
        throw new Error('Email is already taken')
    }

    user.secondaryEmail = email
    user.isSecondaryEmailVerified = false

    await user.save()

    res.status(200).json({
        message: 'Secondary email updated',
    })
})

export const getOtpForSecondaryEmail = expressAsyncHandler(async (req, res) => {
    const user = req.user!

    if (!user.secondaryEmail) {
        res.status(400)
        throw new Error('Secondary email does not exist')
    }

    if (user.isSecondaryEmailVerified) {
        res.status(400)
        throw new Error('Secondary email is already verified')
    }

    const otp = genOtp()

    user.secondaryEmailOtp = crypto
        .createHash('sha256')
        .update(otp.toString())
        .digest('hex')
    user.secondaryEmailOtpExpiry = Date.now() + 1000 * 60 * 5 // 5 minutes

    await user.save()

    await sendOtp(user.secondaryEmail, otp, SendOtpType.VERIFY_SECONDARY_EMAIL)

    res.status(200).json({
        message: 'OTP sent',
    })
})

export const verifySecondaryEmail = expressAsyncHandler(async (req, res) => {
    const user = req.user!

    if (!user.secondaryEmail) {
        res.status(400)
        throw new Error('Secondary email does not exist')
    }

    if (user.isSecondaryEmailVerified) {
        res.status(400)
        throw new Error('Secondary email is already verified')
    }

    if (!user.secondaryEmailOtp || !user.secondaryEmailOtpExpiry) {
        res.status(400)
        throw new Error('OTP is not requested')
    }

    if (Date.now() > user.secondaryEmailOtpExpiry) {
        res.status(400)
        throw new Error('OTP has expired')
    }

    const hashedOtp = crypto
        .createHash('sha256')
        .update(req.body.otp.toString())
        .digest('hex')

    if (hashedOtp !== user.secondaryEmailOtp) {
        res.status(400)
        throw new Error('OTP is incorrect')
    }

    user.isSecondaryEmailVerified = true
    user.secondaryEmailOtp = undefined
    user.secondaryEmailOtpExpiry = undefined

    await user.save()

    res.status(200).json({
        message: 'Secondary email verified',
    })
})

export const makeSecondaryEmailPrimary = expressAsyncHandler(
    async (req, res) => {
        const user = req.user!

        if (!user.secondaryEmail) {
            res.status(400)
            throw new Error('Secondary email does not exist')
        }

        if (!user.isSecondaryEmailVerified) {
            res.status(400)
            throw new Error('Secondary email is not verified')
        }

        const primaryEmail = user.email

        user.email = user.secondaryEmail

        user.secondaryEmail = primaryEmail

        await user.save()

        res.status(200).json({
            message: 'Secondary email made primary',
        })
    }
)
