import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { Permissions } from '../constants'
import { UserDocument, UserModel, UserSchema } from '../interfaces/mongoose.gen'

const PermissionScope = Object.values(Permissions)

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
            default: process.env.DEFAULT_AVATAR,
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
        lastSeen: {
            type: Date,
            required: true,
            default: Date.now,
        },

        // Friends
        sentFriendRequests: [
            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        ],
        friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

        // Privacy settings
        whoCanSeeBio: {
            type: String,
            enum: PermissionScope,
            default: Permissions.EVERYONE,
        },
        whoCanSeeActiveStatus: {
            type: String,
            enum: PermissionScope,
            default: Permissions.FRIENDS,
        },
        whoCanSeeAvatar: {
            type: String,
            enum: PermissionScope,
            default: Permissions.EVERYONE,
        },
        whoCanSeeStatus: {
            type: String,
            enum: PermissionScope,
            default: Permissions.FRIENDS,
        },
        whoCanSendYouMessage: {
            type: String,
            enum: [Permissions.EVERYONE, Permissions.FRIENDS],
            default: Permissions.FRIENDS,
        },
        whoCanSeeLastSeen: {
            type: String,
            enum: PermissionScope,
            default: Permissions.FRIENDS,
        },
        blocked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
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
        lastSeen: this.lastSeen,
        whoCanSeeActiveStatus: this.whoCanSeeActiveStatus,
        whoCanSeeAvatar: this.whoCanSeeAvatar,
        whoCanSeeBio: this.whoCanSeeBio,
        whoCanSeeStatus: this.whoCanSeeStatus,
        whoCanSendYouMessage: this.whoCanSendYouMessage,
        whoCanSeeLastSeen: this.whoCanSeeLastSeen,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    }
}

export const User = mongoose.model<UserDocument, UserModel>('User', UserSchema)
