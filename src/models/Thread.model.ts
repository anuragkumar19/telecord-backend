import mongoose from 'mongoose'
import {
    ThreadDocument,
    ThreadModel,
    ThreadSchema,
} from '../interfaces/mongoose.gen'

const ThreadUserSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isInvite: {
            type: Boolean,
            default: true,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        isNotificationMuted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
)

const ThreadSchema: ThreadSchema = new mongoose.Schema(
    {
        isPrivate: {
            type: Boolean,
            default: true,
        },
        title: String,
        users: [ThreadUserSchema],
        lastMessaged: {
            type: Date,
            default: Date.now,
        },
        identifier: {
            type: String,
            unique: true,
        },
    },
    {
        timestamps: true,
    }
)

export const Thread = mongoose.model<ThreadDocument, ThreadModel>(
    'Thread',
    ThreadSchema
)
