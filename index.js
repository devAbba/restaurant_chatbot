const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const sessionRouter = require('./routes/session.route');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const connectDB = require('./db/mongodb');
require('dotenv').config();
const { authenticate, authConnection } = require('./middleware/authenticate');
const cors = require('cors')

const handleSelection = require('./utils/helpers');
const nodeCache = require('node-cache');
const myCache = new nodeCache();

const User = require('./models/users.model');
const Item = require('./models/items.model');
const Message = require('./utils/messages');


const port = process.env.PORT || 5000
const mongo_url = process.env.MONGO_URL

connectDB(mongo_url);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const sessionMiddleware = session({
    name: 'ssid',
    secret: process.env.SECRET,
    cookie: { maxAge: 1000 * 60 * 10 },
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({mongoUrl: mongo_url})
});

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({extended: false}));


app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

io.use(authConnection);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/session', sessionRouter, (req, res) => {
    res.redirect('/chat')
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'index.html'))
})

app.get('/chat', authenticate, async (req, res, next) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'chat.html'))
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

io.on("connection", (socket) => {
    
    const req = socket.request
    const session_id = req.session.id
    
    const user = myCache.get(req.session.user_info)
    const items = myCache.get('items')

    const map = io.sockets.adapter.rooms

    if (!req.session.user_info){
        socket.emit("ended-session", 'session ended')
        socket.disconnect();
    }

    console.log(`client ${socket.id} connected`);

    if (map.has(session_id)) {
        socket.disconnect()
        return
    }
    socket.join(session_id)

    io.to(session_id).emit('welcome', [new Message('bot', `welcome ${user.name}`), new Message('bot', 'Use \'Start\' to bring up the main menu')])
   
    socket.on("chat message", async (msg) => {
        io.to(session_id).emit("user input", new Message(`${user.name}`, msg))
        handleSelection(socket, io, msg, items, user);
           
    })


    socket.on("disconnect", () => {
        console.log('client disconnected', socket.id)
    })

    socket.on("session-end", (text) => {
        io.to(session_id).emit("ended-session", 'session ended')
        socket.disconnect()
        socket.request.session.destroy()
    })

    socket.on('error', function(err) {
        io.to(session_id).emit("message", new Message('bot', 'unexpected error'))
        console.error('Socket.io Error:', err);
    });
})

app.use(function (error, req, res, next){
    if (error){
        console.log(error)
        res.send("unexpected error")
    } else {
        next()
    }
})

server.listen(port, () => {
    console.log(`server started on port ${port}`)
})