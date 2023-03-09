const express = require('express');
const MongoStore = require('connect-mongo');
const sessionRouter = require('./routes/session.route');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const connectDB = require('./database/mongodb');
const Message = require('./utils/messages');
require('dotenv').config();
const authenticate = require('./middleware/authenticate');

const session = require('express-session');

const port = process.env.PORT || 5000
const mongo_url = process.env.MONGO_URL
const serverName = 'bot'

connectDB(mongo_url);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const sessionMiddleware = session({
    name: 'bsid',
    secret: "changeit",
    cookie: { maxAge: 1000 * 60 * 10},
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({mongoUrl: mongo_url})
});

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(sessionMiddleware)
io.engine.use(sessionMiddleware);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/session', sessionRouter, (req, res) => {
    res.redirect('/chat')
});

app.get('/', (req, res) => {
    res.sendFile('index.html');
})

app.get('/chat', authenticate, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
})


io.on("connection", (socket) => {
    const req = socket.request
   
    const { name, email, phone, address } = req.session.user_info
    
    console.log('client connected', socket.id);

    socket.on("disconnect", () => {
        console.log('client disconnected')
    })

    socket.emit("connected", new Message(serverName, `welcome ${name}`))

    socket.on("chat message", (msg) => {
        socket.emit('chat message', new Message(name, msg))
    })

    socket.on("session-end", (text) => {
        console.log(text)
        socket.emit("ended-session", 'session ended')
        socket.disconnect()
        req.session.destroy()
    })
})

app.use((err, req, res, next) => {
    if (err){
        const errorStatus = error.status || 500
        res.status(errorStatus).send("unexpected error")
        next()
    }
    next()
})

server.listen(port, () => {
    console.log(`server started on port ${port}`)
})