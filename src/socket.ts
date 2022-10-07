import { Server } from 'socket.io'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'
import { socketIOAuthGuard } from './middleware/auth.middleware'

export const handleSocketConnections = (
    io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
    // Ensure auth
    io.use(socketIOAuthGuard)

    io.on('connection', (socket) => {
        console.log(`Connected ${socket.id}`)
        socket.on('disconnect', () => console.log(`Disconnected ${socket.id}`))
    })
}
