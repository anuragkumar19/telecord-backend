import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserDocument, UserSchema, UserModel } from '../interfaces/mongoose.gen'

const UserSchema: UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
        },
        avatar: {
            type: String,
            default() {
                return `https://ui-avatars.com/api/?background=random&name=$&size=480`
            },
        },
        bio: {
            type: String,
            default: '',
        },
        password: {
            type: String,
            required: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        otp: String,
        otpExpiry: Number,
        secondaryEmail: String,
        secondaryEmailOtp: String,
        secondaryEmailOtpExpiry: Number,
        isSecondaryEmailVerified: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
)

UserSchema.pre('save', function (next) {
    const user = this
    if (!user.isModified('password')) return next()

    const salt = bcrypt.genSaltSync(10)
    const hash = bcrypt.hashSync(user.password, salt)
    user.password = hash
    next()
})

UserSchema.methods.comparePassword = function (userPassword: string): boolean {
    return bcrypt.compareSync(userPassword, this.password)
}

UserSchema.methods.generateAuthTokens = function (): {
    accessToken: string
    refreshToken: string
} {
    const user = this
    const refreshToken = jwt.sign(
        {
            _id: user._id,
            type: 'refresh',
        },
        process.env.REFRESH_TOKEN_SECRET
    )
    const accessToken = jwt.sign(
        {
            _id: user._id,
            type: 'access',
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '10m' }
    ) // 10 minutes

    return { refreshToken, accessToken }
}

UserSchema.methods.generateAccessToken = function (): string {
    const user = this
    const accessToken = jwt.sign(
        { _id: user._id, type: 'access' },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '10m' }
    ) // 10 minutes

    return accessToken
}

UserSchema.methods.me = function () {
    return {
        _id: this._id,
        name: this.name,
        email: this.email,
        username: this.username,
        avatar: this.avatar,
        bio: this.bio,
        isEmailVerified: this.isEmailVerified,
        secondaryEmail: this.secondaryEmail,
        isSecondaryEmailVerified: this.isSecondaryEmailVerified,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    }
}

export const User = mongoose.model<UserDocument, UserModel>('User', UserSchema)
