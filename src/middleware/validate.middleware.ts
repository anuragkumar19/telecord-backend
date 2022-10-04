import { Handler } from 'express'
import { Schema } from 'joi'

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
