import mongoose from 'mongoose'
import { StatusDocument, UserDocument } from '../interfaces/mongoose.gen'
import { getSendableUser } from './user.util'

export const isSeen = (status: StatusDocument, user: UserDocument) => {
    return (
        status.seenBy.findIndex((s) =>
            user._id.equals(s as mongoose.Types.ObjectId)
        ) !== -1
    )
}

export const getStatus = (status: StatusDocument, user: UserDocument) => {
    const sendableStatus: any = {}

    sendableStatus._id = status._id
    sendableStatus.caption = status.caption
    sendableStatus.createdAt = status.createdAt
    sendableStatus.media = status.media
    sendableStatus.mediaType = status.mediaType
    sendableStatus.user = getSendableUser(status.user as UserDocument, user)
    sendableStatus.isSeen = isSeen(status, user)

    return sendableStatus
}
