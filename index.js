const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const sessionRouter = require('./routes/session.route');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const connectDB = require('./database/mongodb');
require('dotenv').config();
const authenticate = require('./middleware/authenticate');
const moment = require('moment');
const { userJoin, getCurrentUser, getRoomUsers } = require('./utils/users');

const User = require('./models/users.model');
const Item = require('./models/items.model');
const Message = require('./utils/messages');


const port = process.env.PORT || 5000
const mongo_url = process.env.MONGO_URL

const handleSelection = require('./utils/helpers');
const nodeCache = require('node-cache');
const myCache = new nodeCache();

connectDB(mongo_url);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const sessionMiddleware = session({
    name: 'ssid',
    secret: "changeit",
    cookie: { maxAge: 1000 * 60 * 10 },
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({mongoUrl: mongo_url})
});

app.use((error, req, res, next) => {
    if (error){
        console.log(error)
        res.status(500).send("Unexpected error")
    }
    next()
})

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/session', sessionRouter, (req, res) => {
    res.redirect('/chat')
});

app.get('/', (req, res) => {
    res.sendFile('index.html');
})

app.get('/chat', authenticate, async (req, res, next) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'))
    try {
        const userDetail = await User.findById(req.session.user_info)
        myCache.set(req.session.user_info, userDetail, 60)

        const items = await Item.find({})
        myCache.set('items', items, 60)
        
    }
    catch (error){
        next(error)
    }
})

app.on('session:expired', (req) => {
    console.log('session expired')
    //Get the socket associated with the request
    const socket = req.socket;
    
    //Emit the socket event
    socket.emit("ended-session", 'session ended')
    socket.disconnect()
    
});


io.on("connection", async (socket) => {
    const req = socket.request
    const session_id = req.session.id
    
    const user = myCache.get(req.session.user_info)
    const items = myCache.get('items')

    let chatHistory = []
   
    console.log('client connected', socket.id);
    
    socket.join(session_id)
    

    const deviceTab = userJoin(socket.id, session_id)
    const roomUsers = getRoomUsers(session_id)
    const user1 = roomUsers[0]["username"]
    
    // if (io.sockets.adapter.rooms[session_id].length === 1) {
    //     io.to(session_id).emit('welcome', new Message('bot', `welcome ${user.name}`))
    //   }
    
    if (roomUsers.length === 1){
        io.to(session_id).emit('welcome', new Message('bot', `welcome ${user.name}`))
    }
    // io.to(user1).emit('welcome', new Message('bot', `welcome ${user.name}`))
    // chatHistory.push(new Message('bot', `welcome ${user.name}`))

   
    socket.on("chat message", async (msg) => {
        io.to(session_id).emit("user input", new Message(`${user.name}`, msg))
        chatHistory.push(new Message(`${user.name}`, msg))
        handleSelection(socket, io, msg, items, user);
                  
    })

    socket.on("disconnect", () => {
        console.log('client disconnected', socket.id)
    })

    socket.on("session-end", (text) => {
        io.to(session_id).emit("ended-session", 'session ended')
        socket.disconnect() // change code to disconnect all users in room
        socket.request.session.destroy()
    })
})



server.listen(port, () => {
    console.log(`server started on port ${port}`)
})