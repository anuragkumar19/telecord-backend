import mongoose from 'mongoose'
import {
    MessageDocument,
    MessageModel,
    MessageSchema,
} from '../interfaces/mongoose.gen'
import { UploadType } from '../constants'

const ReactionsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    emoji: {
        type: String,
        required: true,
    },
})

const MessageSchema: MessageSchema = new mongoose.Schema({
    thread: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thread',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    text: {
        type: String,
        require: true,
    },
    reactions: [ReactionsSchema],
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
    },
    replyToStatus: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Status',
    },
    media: {
        type: String,
    },
    mediaType: {
        type: String,
        enum: Object.values(UploadType),
    },
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
})

export const Message = mongoose.model<MessageDocument, MessageModel>(
    'Message',
    MessageSchema
)
