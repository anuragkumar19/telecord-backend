import crypto from 'crypto'
import expressAsyncHandler from 'express-async-handler'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { SendOtpType } from '../constants'
import { User } from '../models/user.model'
import { sendOtp } from '../utils/email.util'
import { genOtp } from '../utils/otp.util'

export const register = expressAsyncHandler(async (req, res) => {
    const { email, name, username, password } = req.body

    let user = await User.findOne({ email })

    if (user && user.isEmailVerified) {
        res.status(400)
        throw new Error('User already exists with the email')
    }

    const checkUsername = await User.findOne({ username })

    if (checkUsername && user?.username !== username) {
        res.status(400)
        throw new Error('Username already taken')
    }

    const otp = genOtp()

    const hashedOtp = crypto
        .createHash('sha256')
        .update(otp.toString())
        .digest('hex')

    const otpExpiry = Date.now() + 5 * 60 * 1000 // 5 minutes

    if (!user) {
        user = new User({
            name,
            username,
            email,
            password,
            otp: hashedOtp,
            otpExpiry,
        })
    } else {
        user.name = name
        user.email = email
        user.username = username
        user.password = password
        user.otp = hashedOtp
        user.otpExpiry = otpExpiry
    }

    await user.save()
    await sendOtp(email, otp, SendOtpType.VERIFY)

    res.status(200).json({
        message: 'Otp sent to you email!',
    })
})

export const verifyEmail = expressAsyncHandler(async (req, res) => {
    const { email, otp } = req.body

    const user = await User.findOne({ email })

    if (!user) {
        res.status(400)
        throw new Error('User not found')
    }

    if (user.isEmailVerified) {
        res.status(400)
        throw new Error('User already verified')
    }

    const hashedOtp = crypto
        .createHash('sha256')
        .update(otp.toString())
        .digest('hex')

    if (user.otp !== hashedOtp) {
        res.status(400)
        throw new Error('Otp is incorrect')
    }

    if (Date.now() > user.otpExpiry!) {
        res.status(400)
        throw new Error('Otp has expired')
    }

    user.isEmailVerified = true
    user.otp = undefined
    user.otpExpiry = undefined

    await user.save()

    res.status(200).json({
        message: 'Email verified successfully',
    })
})

export const forgotPassword = expressAsyncHandler(async (req, res) => {
    const { email } = req.body

    const user = await User.findOne({ email })

    if (!user) {
        res.status(400)
        throw new Error('User not found')
    }

    if (!user.isEmailVerified) {
        res.status(400)
        throw new Error('Email is not verified')
    }

    const otp = genOtp()

    const hashedOtp = crypto
        .createHash('sha256')
        .update(otp.toString())
        .digest('hex')

    const otpExpiry = Date.now() + 5 * 60 * 1000 // 5 minutes

    user.otp = hashedOtp
    user.otpExpiry = otpExpiry

    await user.save()

    await sendOtp(email, otp, SendOtpType.RESET)

    res.status(200).json({
        message: 'Otp sent to you email!',
    })
})

export const resetPassword = expressAsyncHandler(async (req, res) => {
    const { email, otp, password } = req.body

    const user = await User.findOne({ email })

    if (!user) {
        res.status(400)
        throw new Error('User not found')
    }

    if (!user.isEmailVerified) {
        res.status(400)
        throw new Error('Email is not verified')
    }

    const hashedOtp = crypto
        .createHash('sha256')
        .update(otp.toString())
        .digest('hex')

    if (!user.otp || !user.otpExpiry) {
        res.status(400)
        throw new Error('Otp expired')
    }

    if (user.otp !== hashedOtp) {
        res.status(400)
        throw new Error('Otp is incorrect')
    }

    if (Date.now() > user.otpExpiry!) {
        res.status(400)
        throw new Error('Otp has expired')
    }

    user.password = password
    user.otp = undefined
    user.otpExpiry = undefined

    await user.save()

    res.status(200).json({
        message: 'Password reset successfully',
    })
})

export const login = expressAsyncHandler(async (req, res) => {
    const { identifier, password } = req.body

    const user = await User.findOne({
        $or: [{ email: identifier }, { username: identifier }],
    })

    if (!user) {
        res.status(400)
        throw new Error('Invalid credentials')
    }

    if (!user.isEmailVerified) {
        res.status(400)
        throw new Error('Email is not verified')
    }

    if (!user.comparePassword(password)) {
        res.status(400)
        throw new Error('Invalid credentials')
    }

    const tokens = user.generateAuthTokens()

    res.status(200).json({
        tokens,
    })
})

export const refreshToken = expressAsyncHandler(async (req, res) => {
    const { refreshToken } = req.body

    try {
        const payload = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        ) as JwtPayload

        if (payload.type !== 'refresh') {
            res.status(401)
            throw new Error('Invalid refresh token')
        }

        const user = await User.findById(payload._id)

        if (!user) {
            res.status(401)
            throw new Error('Invalid refresh token')
        }

        const accessToken = user.generateAccessToken()

        res.status(200).json({
            tokens: {
                accessToken,
            },
        })
    } catch (err) {
        res.status(401)
        throw new Error('Invalid refresh token')
    }
})
