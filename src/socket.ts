import { Server } from 'socket.io'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'

export const handleSocketConnections = (
    io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
    io.on('connection', (socket) => {
        console.log(`Connected ${socket.id}`)
        socket.on('disconnect', () => console.log(`Disconnected ${socket.id}`))
    })
}