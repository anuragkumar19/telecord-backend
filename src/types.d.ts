import { UserDocument, UserDeviceDocument } from './interfaces/mongoose.gen'

declare global {
    namespace Express {
        export interface Request {
            user?: UserDocument
        }
    }
}
