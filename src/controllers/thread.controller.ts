import expressAsyncHandler from 'express-async-handler'
import { getIdentifier } from '../utils/thread.util'
import { User } from '../models/user.model'
import {
    canSendMessage,
    isBlockedByHim,
    isBlockedByMe,
    isFriend,
} from '../utils/user.util'
import { Thread } from '../models/Thread.model'

export const getThreadByUsername = expressAsyncHandler(async (req, res) => {
    const { username } = req.params

    const user = await User.findOne({ username })

    if (!user || !user.isEmailVerified || isBlockedByHim(req.user!, user)) {
        res.status(404)
        throw new Error('User not found')
    }

    if (user._id.equals(req.user!._id)) {
        res.status(400)
        throw new Error('Cannot message yourself')
    }

    if (isBlockedByMe(req.user!, user)) {
        res.status(400)
        throw new Error('You have blocked this user. Unblock to message')
    }

    if (!canSendMessage(req.user!, user)) {
        res.status(400)
        throw new Error('Cannot send message')
    }

    const identifier = getIdentifier(user, req.user!)

    let thread = await Thread.findOne({ isPrivate: true, identifier })

    if (!thread) {
        thread = await Thread.create({
            isPrivate: true,
            users: [
                { user: req.user!._id, isInvite: false },
                { user: user._id, isInvite: !isFriend(req.user!, user) },
            ],
            identifier,
        })
    }

    res.status(200).json({ thread: thread._id })
})
