import { Handler } from 'express'
import { Schema } from 'joi'
import mongoose from 'mongoose'

export const validate: (schema: Schema) => Handler =
    (schema) => (req, res, next) => {
        const { error, value } = schema.validate(req.body)

        if (!error) {
            req.body = value
            next()
            return
        }

        res.status(400)
        throw new Error(error.details[0].message)
    }

export const validateParams: (key: string) => Handler =
    (key) => (req, res, next) => {
        if (mongoose.isValidObjectId(req.params[key])) {
            next()
        } else {
            res.status(404)
            throw new Error('Not found')
        }
    }
