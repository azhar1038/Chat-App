const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {getUser, getUsersInRoom, addUser, removeUser} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, '../public')
const port = process.env.PORT || 3000

app.use(express.static(publicDirectoryPath))

let count = 0

io.on("connection", (socket)=>{
    console.log('A new WebSocket connected!')
 
    socket.on('join', ({username, room}, acknowledge)=>{
        const {error, user} = addUser({id:socket.id, username, room})

        if(error){
            return acknowledge(error)
        }

        socket.join(user.room)
        
        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined the chat!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        acknowledge()
    })

    socket.on('sendMessage', (message, acknowledge)=>{
        const user = getUser(socket.id)
        if(user){
            const filter = new Filter()
            if(filter.isProfane(message)){
                return acknowledge("Message contains profane words! Rejected!")
            }
            io.to(user.room).emit('message', generateMessage(user.username, message))
            acknowledge()
        }
        
    })

    socket.on('sendLocation', (position, acknowledge)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${position.latitude},${position.longitude}`))
        acknowledge()
    })

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, ()=>{
    console.log('Server is up and running on port: '+port)
})