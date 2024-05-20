import { Request, Response } from 'express'
import { ValidationError } from 'joi'

import {
    HttpError,
    HttpInternalServerError,
    HttpValidationError,
} from '../utils/errors.util'
import LoggerUtil from '../utils/logger.util'

async function handler(error: Error, req: Request, res: Response, next: any) {
    let stackTrace

    if (process.env.ERROR_STACK === '1') {
        stackTrace = error.stack
    }

    if (error instanceof ValidationError) {
        error = new HttpValidationError(
            error.details[0].message,
            error.details[0]
        )
    }

    if (!(error instanceof HttpError)) {
        LoggerUtil.error(error)
        error = new HttpInternalServerError()
    }

    if (error instanceof HttpError) {
        const errorData = {
            type: error.constructor.name,
            message: error.message,
            code: error.statusCode,
            data: error.data ? error.data : {},
            stackTrace,
        }

        return res.headersSent
            ? res.write(JSON.stringify({ error: errorData }))
            : res.status(error.statusCode).send(errorData)
    } else {
        const errorData = { type: error.constructor.name, stackTrace }
        return res.headersSent
            ? res.write(JSON.stringify({ error: errorData }))
            : res.status(500).send(errorData)
    }
}

export default handler
