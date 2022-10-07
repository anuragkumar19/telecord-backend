import crypto from 'crypto'
import { Handler } from 'express'
import expressAsyncHandler from 'express-async-handler'
import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from '../config/cloudinary.config'
import { UploadType } from '../constants'

//  Multer Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: () => `${process.env.UPLOAD_FOLDER}`,
        public_id: () => crypto.randomBytes(16).toString('hex'),
        type: 'upload',
        resource_type: 'auto',
    } as any,
})

export const upload = (
    type: UploadType,
    field: string,
    sizeLimit?: number,
    multiple?: boolean
): Handler =>
    expressAsyncHandler((req, res, next) => {
        const uploaderAlt = multer({
            storage,
            limits: {
                fieldSize: sizeLimit,
            },
            fileFilter: (_req, file, cb) => {
                if (type !== 'any' && !file.mimetype.startsWith(type)) {
                    cb(new Error(`Please upload ${type} Only!`))
                } else {
                    cb(null, true)
                }
            },
        })

        let uploader: Handler

        if (multiple) {
            uploader = uploaderAlt.array(field)
        } else {
            uploader = uploaderAlt.single(field)
        }

        return new Promise((resolve, reject) => {
            uploader(req, res, (err) => {
                res.status(400)
                if (err) {
                    return reject(new Error(err))
                }

                if (multiple && (!req.files || req.files.length === 0)) {
                    return reject(new Error(`Please select an ${type}`))
                }

                if (!req.file) {
                    return reject(new Error(`Please select an ${type}`))
                }

                res.status(200)
                next()
                resolve(multiple ? req.files : (req.file as any))
            })
        })
    })
