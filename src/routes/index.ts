import { Express } from 'express'
import { HttpNotFound } from '../utils/errors.util'
import * as UserController from '../controllers/user.controllers';
import * as EventController from '../controllers/event.controllers';

const routes = (app: Express) => {
    app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader(
            'Access-Control-Allow-Methods',
            'GET, POST, OPTIONS, PUT, PATCH, DELETE'
        )
        res.setHeader(
            'Access-Control-Allow-Headers',
            'X-Requested-With, content-type, x-access-token, authorization'
        )
        res.setHeader('Access-Control-Allow-Credentials', 'true')
        res.removeHeader('X-Powered-By')
        next()
    })

    app.get('/v1/health-check', (req, res) => {
        res.sendStatus(200)
    })
     
     app.post('/users', UserController.createUser);

    app.use(function (req, res, next) {
        return next(new HttpNotFound())
    })
    app.post('/events', EventController.createEvent);

}

export default routes
