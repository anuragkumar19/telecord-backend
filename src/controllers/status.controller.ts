import expressAsyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import { Permissions, UploadType } from '../constants'
import { UserDocument } from '../interfaces/mongoose.gen'
import { Status } from '../models/Status.model'
import { User } from '../models/user.model'
import { getStatus, isSeen } from '../utils/status.util'
import { getSendableUser, isBlockedByHim, isFriend } from '../utils/user.util'

export const createStatusWithImage = expressAsyncHandler(async (req, res) => {
    const user = req.user!
    const file = req.file!

    const media = file.path

    const status = await Status.create({
        user: user._id,
        caption: req.body.caption,
        media,
        mediaType: UploadType.IMAGE,
    })

    res.status(201).json({ status })
})

export const createStatusWithVideo = expressAsyncHandler(async (req, res) => {
    const user = req.user!
    const file = req.file!

    const media = file.path

    const status = await Status.create({
        user: user._id,
        caption: req.body.caption,
        media,
        mediaType: UploadType.VIDEO,
    })

    res.status(201).json({ status })
})

export const deleteStatus = expressAsyncHandler(async (req, res) => {
    const { id } = req.params

    const status = await Status.findById(id)

    if (!status) {
        res.status(404)
        throw new Error('Status not found')
    }

    if (!req.user!._id.equals(status.user as any as mongoose.Types.ObjectId)) {
        res.status(404)
        throw new Error('Status not found')
    }

    await status.remove()

    res.status(200).json({ message: 'Status deleted.' })
})

export const getMyStatus = expressAsyncHandler(async (req, res) => {
    const status = await Status.find({ id: req.user!._id })
        .populate('seenBy')
        .populate('user')

    const sendableStatus = status.map((s) => {
        const sendableStatus = getStatus(s, req.user!)
        sendableStatus.seenBy = s.seenBy.map((u) =>
            getSendableUser(u, req.user!)
        ) as any as mongoose.Types.Array<UserDocument>
        return sendableStatus
    })

    res.status(200).json({ status: sendableStatus })
})

export const getStatusOfAUser = expressAsyncHandler(async (req, res) => {
    const { id } = req.params

    const user = await User.findById(id)

    if (!user || !user.isEmailVerified || isBlockedByHim(req.user!, user)) {
        res.status(404)
        throw new Error('User not found')
    }

    const status = await Status.find({ user: user._id })
        .populate('user')
        .sort('+createdAt')

    let sendableStatus = status.map((s) => getStatus(s, req.user!))

    if (
        user.whoCanSeeStatus === Permissions.EVERYONE ||
        (user.whoCanSeeStatus === Permissions.FRIENDS &&
            isFriend(user, req.user!))
    ) {
        res.status(200).json({
            status: sendableStatus,
        })
        return
    }

    res.json({
        status: [],
    })
})

export const getStatusOfFriends = expressAsyncHandler(async (req, res) => {
    const allAStatus = await Status.find({
        user: { $in: req.user!.friends },
    })
        .populate('user')
        .sort('+createdAt')

    let sendableStatus = allAStatus.map((s) => getStatus(s, req.user!))

    const status: any = {}

    sendableStatus.forEach((s) => {
        const key = s.user._id.toString()

        if (!status[key]) {
            status[key] = {
                user: s.user,
                items: [],
            }
        }
        if (status[key].user.whoCanSeeStatus === Permissions.NOBODY) return
        s.user = undefined
        status[key].items.push(s)
    })

    res.json({
        statusTray: Object.values(status).reverse(),
    })
})


export const markStatusSeen = expressAsyncHandler(async (req, res) => {
    const { id } = req.params

    const status = await Status.findById(id).populate('user')

    if (!status || status.user._id.equals(req.user!._id)) {
        res.status(404)
        throw new Error('Status not found')
    }

    if (
        status.user.whoCanSeeStatus === Permissions.NOBODY ||
        (status.user.whoCanSeeStatus === Permissions.FRIENDS &&
            !isFriend(req.user!, status.user))
    ) {
        res.status(404)
        throw new Error('Status not found')
    }

    if (isSeen(status, req.user!)) {
        res.status(400)
        throw new Error('Already seen')
    }

    status.seenBy.push(req.user!._id)

    await status.save()

    res.status(200).json({
        message: 'Seen',
    })
})
