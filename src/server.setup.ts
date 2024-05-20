import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'

import errorHandler from './middleware/errorHandler'
import routes from './routes'

const service = express()

service.use(cors())
service.use(bodyParser.json())
service.use(bodyParser.text())

routes(service)

service.use(errorHandler)

export default service
