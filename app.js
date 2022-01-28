const express = require('express')
const app = express()
const server = require('http').createServer(app)
const socketio = require('socket.io')
const { userjs, addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')


const port = process.env.PORT || 3000

const io = socketio(server)
app.use(express.static(__dirname + '/public'))

io.on('connection', (socket)=>{

    socket.on('join',({username, room}, callback) => {
        const {error, user} = addUser({id: socket.id, username: username, room: room})

        if(error) {
            return callback(error)
        }
        socket.join(user.room)
        const users = getUsersInRoom(user.room)
        socket.emit('userlist',users)
        socket.broadcast.to(user.room).emit('userlist',users)
        callback()
    })

    socket.on('draw', (data, callback)=>{
        const user = getUser(socket.id)
        if(!user) return callback('error')
        try{
            socket.broadcast.to(user.room).emit('ondraw', data)
        }catch{
            callback('Service disrupted for short')
        }
        callback()
    })
    // text chat implement
    socket.on('message', (msg) => {
        const user = getUser(socket.id)
        socket.broadcast.to(user.room).emit('message', msg)
    })

    // audio chat implementation
    socket.on("voice", (data)=>{
        const user = getUser(socket.id)
        var newData = data.split(";")
        newData[0] = "data:audio/ogg;"
        newData = newData[0] + newData[1]
        socket.broadcast.to(user.room).emit('send', newData)
      })


    socket.on('disconnect', (reason)=>{
        const user = removeUser(socket.id)
        if(user){
            const users = getUsersInRoom(user.room)
            socket.broadcast.to(user.room).emit('userlist',users)
        }
    })
})

server.listen(port, (error)=>{
    if(error)
    console.log(error)
    else
    console.log(`Server running on port ${port}`)
})