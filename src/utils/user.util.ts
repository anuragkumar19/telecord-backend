import mongoose from 'mongoose'
import { Permissions } from '../constants'
import { UserDocument } from '../interfaces/mongoose.gen'

export const isFriend = (u1: UserDocument, u2: UserDocument) => {
    return !!u1.friends.find((f) => u2._id.equals(f as mongoose.Types.ObjectId))
}

export const isInFriendRequest = (user: UserDocument, friend: UserDocument) => {
    return (
        user.friendRequests.findIndex((f) =>
            friend._id.equals(f as mongoose.Types.ObjectId)
        ) !== -1
    )
}

export const isInSentFriendRequest = (
    user: UserDocument,
    friend: UserDocument
) => {
    return (
        user.sentFriendRequests.findIndex((f) =>
            friend._id.equals(f as mongoose.Types.ObjectId)
        ) !== -1
    )
}

export const isBlockedByMe = (me: UserDocument, he: UserDocument) => {
    return (
        me.blocked.findIndex((u) =>
            he._id.equals(u as mongoose.Types.ObjectId)
        ) !== -1
    )
}

export const isBlockedByHim = (me: UserDocument, he: UserDocument) => {
    return (
        he.blocked.findIndex((u) =>
            me._id.equals(u as mongoose.Types.ObjectId)
        ) !== -1
    )
}

export const canSendMessage = (me: UserDocument, he: UserDocument) => {
    if (he.whoCanSendYouMessage === Permissions.FRIENDS && !isFriend(me, he)) {
        return false
    } else {
        return true
    }
}

export const getSendableUser = (user: UserDocument, reqUser: UserDocument) => {
    interface SendableUser {
        _id: mongoose.Types.ObjectId
        name: string
        username: string
        avatar: string
        bio?: string
        isFriend: boolean
        isInFriendRequest: boolean
        isInSentFriendRequest: boolean
        isBlocked: boolean
        lastSeen?: Date
        canSendMessage: boolean
    }

    const sendableUser: SendableUser = {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: process.env.DEFAULT_AVATAR,
        bio: '',
        isFriend: false,
        isInFriendRequest: false,
        isInSentFriendRequest: false,
        isBlocked: false,
        canSendMessage: true,
    }

    if (
        user.whoCanSeeAvatar === Permissions.EVERYONE ||
        (user.whoCanSeeAvatar === Permissions.FRIENDS &&
            isFriend(user, reqUser))
    ) {
        sendableUser.avatar = user.avatar!
    }

    if (
        user.whoCanSeeBio === Permissions.EVERYONE ||
        (user.whoCanSeeBio === Permissions.FRIENDS && isFriend(user, reqUser))
    ) {
        sendableUser.bio = user.bio || ''
    }

    if (
        user.whoCanSeeBio === Permissions.EVERYONE ||
        (user.whoCanSeeBio === Permissions.FRIENDS && isFriend(user, reqUser))
    ) {
        sendableUser.lastSeen = user.lastSeen
    }

    sendableUser.isFriend = isFriend(user, reqUser)
    sendableUser.isInFriendRequest = isInFriendRequest(reqUser, user)
    sendableUser.isInSentFriendRequest = isInSentFriendRequest(reqUser, user)
    sendableUser.isBlocked = isBlockedByMe(reqUser, user)
    sendableUser.canSendMessage = canSendMessage(reqUser, user)

    return sendableUser
}
