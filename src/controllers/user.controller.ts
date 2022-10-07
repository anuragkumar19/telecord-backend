import crypto from 'crypto'
import { Handler } from 'express'
import expressAsyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import { SendOtpType } from '../constants'
import { User } from '../models/user.model'
import { sendOtp } from '../utils/email.util'
import { genOtp } from '../utils/otp.util'
import {
    getSendableUser,
    isBlockedByHim,
    isBlockedByMe,
    isFriend,
    isInFriendRequest,
    isInSentFriendRequest,
} from '../utils/user.util'

export const getLoggedInUser: Handler = (req, res) => {
    const user = req.user!

    res.status(200).json({
        user: user.me(),
    })
}

export const getFriendsDetail = expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user!._id)
        .populate('friends')
        .populate('friendRequests')
        .populate('sentFriendRequests')

    if (!user) {
        res.status(400)
        throw new Error('Something went wrong.')
    }

    const friends = user.friends.map((f) => getSendableUser(f, req.user!))
    const friendRequests = user.friendRequests.map((f) =>
        getSendableUser(f, req.user!)
    )
    const sentFriendRequests = user.sentFriendRequests.map((f) =>
        getSendableUser(f, req.user!)
    )

    res.status(200).json({
        friends,
        friendRequests,
        sentFriendRequests,
    })
})

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

export const sendOrAcceptRequest = expressAsyncHandler(async (req, res) => {
    const { id } = req.params

    const user = req.user!

    const friend = await User.findById(id)

    if (!friend || !friend.isEmailVerified) {
        res.status(404)
        throw new Error('User not found')
    }

    if (user._id.equals(friend._id)) {
        res.status(400)
        throw new Error('You can not add yourself as a friend')
    }

    // If the friend have blocked you
    if (isBlockedByHim(user, friend)) {
        res.status(404)
        throw new Error('User not found')
    }

    // If you have blocked him
    if (isBlockedByMe(user, friend)) {
        res.status(400)
        throw new Error(
            'You have blocked this user. You have to unblock him before sending friend request'
        )
    }

    // Check if already friend
    if (isFriend(user, friend)) {
        res.status(400)
        throw new Error('Already friends')
    }

    // Check if friend request already sent
    if (isInSentFriendRequest(user, friend)) {
        res.status(400)
        throw new Error('Already sent friend request')
    }

    // If request pending then accept
    if (isInFriendRequest(user, friend)) {
        user.friendRequests = user.friendRequests.filter(
            (f) => !friend._id.equals(f as mongoose.Types.ObjectId)
        ) as mongoose.Types.Array<mongoose.Types.ObjectId>

        friend.sentFriendRequests = friend.sentFriendRequests.filter(
            (f) => !user._id.equals(f as mongoose.Types.ObjectId)
        ) as mongoose.Types.Array<mongoose.Types.ObjectId>

        user.friends = [
            ...user.friends,
            friend._id,
        ] as mongoose.Types.Array<mongoose.Types.ObjectId>
        friend.friends = [
            ...friend.friends,
            user._id,
        ] as mongoose.Types.Array<mongoose.Types.ObjectId>

        await user.save()
        await friend.save()

        res.status(200).json({
            message: 'Friend request accepted',
        })
        return
    }

    // Else Send the request
    friend.friendRequests.push(user._id)
    user.sentFriendRequests.push(friend._id)

    await user.save()
    await friend.save()

    res.status(200).json({ message: 'Friend Request sent.' })
})

export const unfriendOrCancelFriendRequest = expressAsyncHandler(
    async (req, res) => {
        const { id } = req.params

        const user = req.user!

        const friend = await User.findById(id)

        if (!friend || !friend.isEmailVerified) {
            res.status(404)
            throw new Error('User not found')
        }

        if (user._id.equals(friend._id)) {
            res.status(400)
            throw new Error('You can not add yourself as a friend')
        }

        // If the friend have blocked you
        if (isBlockedByHim(user, friend)) {
            res.status(404)
            throw new Error('User not found')
        }

        // If you have blocked friend
        if (isBlockedByMe(user, friend)) {
            res.status(400)
            throw new Error(
                'You have blocked this user. You have to unblock him before sending friend request'
            )
        }

        // Check if friend
        if (isFriend(user, friend)) {
            user.friends = user.friends.filter(
                (f) => !friend._id.equals(f as mongoose.Types.ObjectId)
            ) as mongoose.Types.Array<mongoose.Types.ObjectId>

            friend.friends = friend.friends.filter(
                (f) => !user._id.equals(f as mongoose.Types.ObjectId)
            ) as mongoose.Types.Array<mongoose.Types.ObjectId>

            await user.save()
            await friend.save()

            res.status(200).json({
                message: 'Unfriended',
            })
            return
        }

        // Check if friend request already sent
        if (isInSentFriendRequest(user, friend)) {
            user.sentFriendRequests = user.sentFriendRequests.filter(
                (f) => !friend._id.equals(f as mongoose.Types.ObjectId)
            ) as mongoose.Types.Array<mongoose.Types.ObjectId>

            friend.friendRequests = friend.friendRequests.filter(
                (f) => !user._id.equals(f as mongoose.Types.ObjectId)
            ) as mongoose.Types.Array<mongoose.Types.ObjectId>

            await user.save()
            await friend.save()

            res.status(200).json({
                message: 'Friend request cancelled',
            })
            return
        }

        // Check if friend request received
        if (isInFriendRequest(user, friend)) {
            user.friendRequests = user.friendRequests.filter(
                (f) => !friend._id.equals(f as mongoose.Types.ObjectId)
            ) as mongoose.Types.Array<mongoose.Types.ObjectId>

            friend.sentFriendRequests = friend.sentFriendRequests.filter(
                (f) => !user._id.equals(f as mongoose.Types.ObjectId)
            ) as mongoose.Types.Array<mongoose.Types.ObjectId>

            await user.save()
            await friend.save()

            res.status(200).json({
                message: 'Friend request rejected',
            })
            return
        }

        res.status(400)
        throw new Error('Requested action cannot be performed')
    }
)

export const blockUser = expressAsyncHandler(async (req, res) => {
    const { id } = req.params

    const user = req.user!
    const userToBeBlocked = await User.findById(id)

    if (!userToBeBlocked || !userToBeBlocked.isEmailVerified) {
        res.status(404)
        throw new Error('User not found')
    }

    if (isBlockedByMe(user, userToBeBlocked)) {
        res.status(400)
        throw new Error('User Already Blocked')
    }

    user.blocked.push(userToBeBlocked._id)

    if (isInSentFriendRequest(user, userToBeBlocked)) {
        user.sentFriendRequests = user.sentFriendRequests.filter(
            (f) => !userToBeBlocked._id.equals(f as mongoose.Types.ObjectId)
        ) as mongoose.Types.Array<mongoose.Types.ObjectId>

        userToBeBlocked.friendRequests = userToBeBlocked.friendRequests.filter(
            (f) => !user._id.equals(f as mongoose.Types.ObjectId)
        ) as mongoose.Types.Array<mongoose.Types.ObjectId>

        await userToBeBlocked.save()
    }

    if (isInFriendRequest(user, userToBeBlocked)) {
        user.friendRequests = user.friendRequests.filter(
            (f) => !userToBeBlocked._id.equals(f as mongoose.Types.ObjectId)
        ) as mongoose.Types.Array<mongoose.Types.ObjectId>

        userToBeBlocked.sentFriendRequests =
            userToBeBlocked.sentFriendRequests.filter(
                (f) => !user._id.equals(f as mongoose.Types.ObjectId)
            ) as mongoose.Types.Array<mongoose.Types.ObjectId>

        await userToBeBlocked.save()
    }

    if (isFriend(user, userToBeBlocked)) {
        user.friends = user.friends.filter(
            (f) => !userToBeBlocked._id.equals(f as mongoose.Types.ObjectId)
        ) as mongoose.Types.Array<mongoose.Types.ObjectId>

        userToBeBlocked.friends = userToBeBlocked.friends.filter(
            (f) => !user._id.equals(f as mongoose.Types.ObjectId)
        ) as mongoose.Types.Array<mongoose.Types.ObjectId>

        await userToBeBlocked.save()
    }

    await user.save()
    res.status(200).json({
        message: 'User blocked',
    })
})

export const unblockUser = expressAsyncHandler(async (req, res) => {
    const { id } = req.params

    const user = req.user!
    const blockedUser = await User.findById(id)

    if (!blockedUser || !blockedUser.isEmailVerified) {
        res.status(404)
        throw new Error('User not found')
    }

    if (isBlockedByMe(user, blockedUser)) {
        user.blocked = user.blocked.filter(
            (u) => !blockedUser._id.equals(u as mongoose.Types.ObjectId)
        ) as mongoose.Types.Array<mongoose.Types.ObjectId>

        await user.save()
        res.status(200).json({
            message: 'User unblocked.',
        })
        return
    }

    res.status(400)
    throw new Error('User not blocked yet.')
})

export const updateAccountPrivacy = expressAsyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user!._id, { ...req.body })

    res.status(200).json({
        message: 'Saved',
    })
})

export const getUser = expressAsyncHandler(async (req, res) => {
    const { id } = req.params

    const user = await User.findById(id)

    if (!user || !user.isEmailVerified || isBlockedByHim(req.user!, user)) {
        res.status(404)
        throw new Error('User not found.')
    }

    const sendableUser = getSendableUser(user, req.user!)

    res.status(200).json({
        user: sendableUser,
    })
})

export const getBlockedUsers = expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user!._id).populate('blocked')

    if (!user) {
        res.status(400)
        throw new Error('Something went wrong.')
    }

    const blockedUsers = user.blocked.map((u) => getSendableUser(u, req.user!))

    res.status(200).json({
        blockedUsers,
    })
})

export const searchUser = expressAsyncHandler(async (req, res) => {
    let { q, page: pageStr, limit: limitStr } = req.query

    let page: number = Number(pageStr)
    let limit: number = Number(limitStr)

    if (typeof q !== 'string') {
        res.status(400)
        throw new Error('Invalid Query parameter')
    }

    if (isNaN(page) || isNaN(limit)) {
        page = 1
        limit = 10
    }

    q = q.trim()

    if (!q) {
        res.status(400)
        throw new Error('Query is required')
    }

    let users = await User.find({
        $or: [
            { username: { $regex: q, $options: 'i' }, isEmailVerified: true },
            { name: { $regex: q, $options: 'i' }, isEmailVerified: true },
        ],
    })
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit)

    users = users.filter((u) => !isBlockedByHim(req.user!, u))

    res.status(200).json({
        users: users.map((u) => getSendableUser(u, req.user!)),
    })
})
