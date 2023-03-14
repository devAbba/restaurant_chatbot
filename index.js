const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const sessionRouter = require('./routes/session.route');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const connectDB = require('./database/mongodb');
const Message = require('./utils/messages');
require('dotenv').config();
const { authConnection, authenticate} = require('./middleware/authenticate');
const { userJoin, getCurrentUser, getRoomUsers } = require('./utils/users')


const User = require('./models/users.model');
const Item = require('./models/items.model');
const Order = require('./models/orders.model')

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

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);
io.use(authConnection)

app.use(express.static(path.join(__dirname, 'public')));

app.use('/session', sessionRouter, (req, res) => {
    res.redirect('/chat')
});

app.get('/', (req, res) => {
    res.sendFile('index.html');
})

app.get('/chat', authenticate, async (req, res) => {
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


io.on("connection", async (socket) => {
    const req = socket.request
    const session_id = req.session.id
    const roomName = session_id
    const user = myCache.get(req.session.user_info)
    const items = myCache.get('items')

    let chatHistory = []
    let current_selection = []
    let current_order = []

    let state = ''


    console.log('client connected', socket.id);

    socket.emit('welcome', new Message('bot', `welcome ${user.name}`))
    chatHistory.push(new Message('bot', `welcome ${user.name}`))
    
    // socket.on('joinRoom', (name) => {
    //     socket.join(roomName)
    //     const user = userJoin(name, roomName)
    //     const users = getRoomUsers(roomName)
    //     console.log(users)

    //     io.to(roomName).emit('message', new Message(serverName, `welcome ${name}`))  

    // })
   
    socket.on("chat message", async (msg) => {
        socket.emit("user input", new Message(`${user.name}`, msg))
        chatHistory.push(new Message(`${user.name}`, msg))

        if (state === 'food menu'){
            
            if (msg.indexOf(',') === -1){
                const patterns = [new RegExp(msg, 'i')]
            } 

            let selection = msg.split(',')
            selection = selection.map(item => item.trim())
            const patterns = selection.map(i => new RegExp(i, 'i'))

            const matches = items.filter((item) => {
                return patterns.some((pattern) => {
                  return pattern.test(item.name);
                });
            });  
        
            if (matches.length === 0){ 
                socket.emit('invalid input', new Message('bot', 'invalid input. Try again')) 
                state = 'food menu'
            } else {
                matches.forEach(item => {
                    current_selection.push({id: item._id,'name': item.name, 'price': item.price})
                })
                state = 'confirm entry'
                socket.emit('confirm entry', [new Message('bot', 'Your current selection. Type \'Yes\' if it\'s correct and \'No\' if it isn\'t'), current_selection])
            }
        }
        else if (state === 'confirm entry'){
            switch (msg.toLowerCase()){
                case 'yes':
                    current_order.push(current_selection)
                    current_selection = []
                    socket.emit('add order', new Message('bot', 'would you like to place another order? Yes/No'))
                    state = 'add order'
                    break;
                case 'no':
                    current_selection = []
                    socket.emit('redo order entry', new Message('bot', 'make your selection again. Be sure to use the same spellings as shown on the menu'))
                    state = 'food menu'
                    break;
                default:
                    socket.emit('invalid input', new Message('bot', 'invalid input. Try again'))
            }
        }
        else if (state === 'add order'){
            switch (msg.toLowerCase()){
                case 'yes':
                    state = 'food menu'
                    socket.emit('items', [items, new Message('bot', 'Here is a list of items you can choose from. \n Make your selection by typing out the name of the item as shown below, seperated with commas')])
                    break;
                case 'no':
                    state = ''
                    socket.emit('main menu', 'return to main menu')
                    break;
                default:
                    socket.emit('invalid input', new Message('bot', 'invalid input. Try again'))
            }
        }
        else if (state === 'confirm order'){
           switch (msg.toLowerCase()){
                case 'yes':
                    
                    current_order.forEach(async (order) => {
                        let id = []
                        order.forEach((item) => id.push(item.id))
                        const orderToSave = new Order({
                            delivery_info: user._id,
                            items: id
                        })
                        const savedOrder = await orderToSave.save()

                        const userInDB = await User.findById(user._id);
                        userInDB.orders = userInDB.orders.concat(savedOrder._id);

                        await userInDB.save();
                    })
                
                    socket.emit('order confirmed', new Message('bot', `Your order has been confirmed and be dispatched to ${user.address}`))
                    break;
                case '0':
                    current_order = []
                    socket.emit('cancel order', new Message('bot', "Your order has been cancelled"))
                    socket.emit('main menu', 'return to main menu')
                    state = ''
                    break;
                default:
                    socket.emit('invalid input', new Message('bot', 'invalid input. Try again'))
           }
        }
        
        else {
            switch (msg){
                case '1':
                    if(!state){
                        state = 'food menu'
                        const itemCache = myCache.get('items')
                        const items = itemCache.map(item => { 
                            return {'name': item.name, 'price': item.price}
                        })
                        socket.emit('items', [items, new Message('bot', 'Here is a list of items you can choose from. \n Make your selection by typing out the name of the item as shown below, seperated with commas')])  
                    }
                    break;
                case '99':
                    if (current_order.length === 0){
                        socket.emit('no selections', new Message('bot', 'you currently do not have any selections. Please place an order before checking out'))
                        socket.emit('main menu', 'return to main menu')
                        state = ''
                    } else {
                        let total = 0;
                        current_order.forEach((item) => {
                            item.forEach(prop => {
                                total += prop.price
                            })
                        })
                        socket.emit('checkout', new Message('bot', `Your order: #${total} \n Delivery fee: #1000 \n Total: #${total + 1000}`))       
                        socket.emit('confirm order', new Message('bot', 'Confirm order? type \'Yes\' to confirm, 0 to cancel order'))
                        state = 'confirm order'
                    }
                    
                    break;
                case '98':
                    break;
                case '97':
                    break;
                case '0':
                    current_order = []
                    socket.emit('cancel order', new Message('bot', "Your order has been cancelled"))
                    socket.emit('main menu', 'return to main menu')
                    state = ''
                    break;
                default:
                    socket.emit('invalid input', new Message('bot', 'invalid input. Try again'))
    
            }
        }
        
        


       
    })

    
    // socket.on("chat message", (msg) => {
    //     const user = getCurrentUser()
    //     io.to('roomName').emit('chat message', new Message('username', msg))
    // })
    

    socket.on("disconnect", () => {
        console.log('client disconnected')
    })

    socket.on("session-end", (text) => {
        console.log(text)
        socket.emit("ended-session", 'session ended')
        socket.disconnect()
        socket.request.session.destroy()
    })
})



server.listen(port, () => {
    console.log(`server started on port ${port}`)
})