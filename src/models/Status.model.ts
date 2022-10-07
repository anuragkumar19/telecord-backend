import mongoose from 'mongoose'
import { UploadType } from '../constants'
import {
    StatusDocument,
    StatusModel,
    StatusSchema,
} from '../interfaces/mongoose.gen'

const StatusSchema: StatusSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        media: {
            type: String,
            required: true,
        },
        mediaType: {
            type: String,
            enum: [UploadType.IMAGE, UploadType.VIDEO],
        },
        caption: {
            type: String,
        },
        seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true }
)

StatusSchema.index({ createdAt: 1 }, { expires: 60 * 60 * 24 }) // 24 hour

export const Status = mongoose.model<StatusDocument, StatusModel>(
    'Status',
    StatusSchema
)
