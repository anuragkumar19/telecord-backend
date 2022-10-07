import { ThreadDocument, UserDocument } from '../interfaces/mongoose.gen'
import { getSendableUser } from './user.util'

export const getIdentifier = (u1: UserDocument, u2: UserDocument) => {
    const s1 = u1._id.toString()
    const s2 = u2._id.toString()

    return s1 < s2 ? s1 + s2 : s2 + s1
}

export const getThread = (thread: ThreadDocument, user: UserDocument) => {
    const sendableThread: any = {}

    sendableThread.isPrivate = thread.isPrivate
    sendableThread.lastMessaged = thread.lastMessaged
    sendableThread.identifier = thread.identifier
    sendableThread.users = thread.users.map((u) => ({
        ...u,
        user: getSendableUser(u.user as UserDocument, user),
    }))

    if (thread.isPrivate) {
        
    } else {
        
    }
}
