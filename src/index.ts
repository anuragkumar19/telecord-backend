import 'dotenv-safe/config'
import 'colors'
import './config/db.config'
import compression from 'compression'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { __prod__ } from './constants'
import { errorHandler, notFound } from './middleware/errors.middleware'
import { router } from './routes/index.routes'
import { handleSocketConnections } from './socket'

const app = express()

const server = createServer(app)

const io = new Server(server, { cors: { origin: '*' }, path: '/ws/v1' })

// Socket handler
handleSocketConnections(io)

// Middleware
app.use(express.json())
app.use(helmet())
app.use(cors())
app.use(compression())

app.disable('x-powered-by')

// Logging
!__prod__ && app.use(morgan('dev'))

// Router
app.use(router)

// If route doesn't exist
app.use(notFound)

// Error Handler
app.use(errorHandler)

const PORT = process.env.PORT || 3001

server.listen(PORT, () =>
    console.log(
        `Server started in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`
            .bgCyan.bold
    )
)
