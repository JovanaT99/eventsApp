import dotenv from 'dotenv'
dotenv.config()

import Api from './server.setup'
import LoggerUtil from './utils/logger.util'
import prisma from './utils/prisma'

prisma.$connect().then(() => {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
    Api.listen(port, () => {
        LoggerUtil.info(`Express running on port ${port}`)
    })
})
