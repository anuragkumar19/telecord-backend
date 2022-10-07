import { Handler } from 'express'
import expressAsyncHandler from 'express-async-handler'
import { Schema } from 'joi'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { Socket } from 'socket.io'
import { ExtendedError } from 'socket.io/dist/namespace'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'
import { User } from '../models/user.model'
import { passwordVerifySchema } from '../validations/UserInputSchema'
import { validate } from './validate.middleware'

export const authGuard = expressAsyncHandler(async (req, res, next) => {
    const token = req.header('Authorization')

    if (!token) {
        res.status(401)
        throw new Error('No token provided')
    }

    const accessToken = token.split(' ')[1]

    if (!accessToken) {
        res.status(401)
        throw new Error('Invalid token')
    }

    try {
        const payload = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        ) as JwtPayload
        const user = await User.findById(payload._id)

        if (!user) {
            res.status(401)
            throw new Error('Invalid token')
        }

        req.user = user
        next()
    } catch (err) {
        res.status(401)
        throw new Error('Invalid token')
    }
})

export const verifyPassword: (schema?: Schema) => Handler =
    (schema) => (req, res, next) => {
        validate(schema ? schema : passwordVerifySchema)(req, res, () => {
            const { password } = req.body

            if (req.user!.comparePassword(password)) {
                return next()
            }

            res.status(401)
            throw new Error('Invalid password')
        })
    }

export const socketIOAuthGuard = async (
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
    next: (err?: ExtendedError | undefined) => void
) => {
    const token = socket.handshake.auth.token

    if (typeof token !== 'string') {
        next(new Error('Invalid token'))
        return
    }

    if (!token) {
        next(new Error('No token provided'))
        return
    }

    const accessToken = token.split(' ')[1]

    if (!accessToken) {
        next(new Error('Invalid token'))
        return
    }

    try {
        const payload = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        ) as JwtPayload
        const user = await User.findById(payload._id)

        if (!user) {
            next(new Error('Invalid token'))
            return
        }

        socket.data.user = user
        next()
    } catch (err) {
        next(new Error('Invalid token'))
        return
    }
}
