import { ErrorRequestHandler, Handler } from 'express'
import { sentenceCase } from 'sentence-case'

export const notFound: Handler = (_req, res) => {
    res.status(404).json({ status: 404, message: 'Route Not Found' })
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode

    if (err.statusCode) {
        statusCode = err.statusCode
    }

    statusCode === 500 && console.error(err)

    res.status(statusCode).json({
        status: statusCode,
        message:
            statusCode === 500 ? 'Server Error!' : sentenceCase(err.message),
    })
}
