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
const Order = require('./models/orders.model');
const Message = require('./utils/messages');
const OrderFormat = require('./utils/orders');

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
    const roomName = session_id
    const user = myCache.get(req.session.user_info)
    const items = myCache.get('items')

    let chatHistory = []
    let current_selection = []
    let current_order = []
    const confirmed_orders = []
    let address = ''

    let state = ''


    console.log('client connected', socket.id);

    socket.emit('welcome', new Message('bot', `welcome ${user.name}`))
    chatHistory.push(new Message('bot', `welcome ${user.name}`))
    
   
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
        else if (state === 'address'){
            address = msg
            socket.emit('confirm order', new Message('bot', 'Confirm order? type \'Yes\' to confirm, 0 to cancel order'))
            state = 'confirm order'
        }
        else if (state === 'confirm order'){
           switch (msg.toLowerCase()){
                case 'yes':
                    const idsArr = current_order.map(order => order.map(({id}) => (id)))
                
                    idsArr.forEach(async (order) => {
                        orderToSave = new Order({delivery_address: address, items: order})
                        savedOrder = await orderToSave.save()
                        confirmed_orders.push(savedOrder._id)

                        const userInDB = await User.findById(user._id);
                        userInDB.orders = userInDB.orders.concat(savedOrder._id);

                        await userInDB.save();
                    })
                
                    socket.emit('order confirmed', new Message('bot', `Your order has been confirmed and will be dispatched to ${address}`))
                    socket.emit('main menu', 'return to main menu')
                    state = ''
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
                        const itemsTrimmed = items.map(item => { 
                            return {'name': item.name, 'price': item.price}
                        })
                        socket.emit('items', [itemsTrimmed, new Message('bot', 'Here is a list of items you can choose from. \n Make your selection by typing out the name of the item as shown below, seperated with commas')])  
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
                        socket.emit('checkout', new Message('bot', `Your order total: #${total} \n Delivery fee: #1000 \n Total: #${total + 1000}`))
                        socket.emit('address', new Message('bot', 'Please enter your delivery address'))
                        state = 'address'
                        // socket.emit('confirm order', new Message('bot', 'Confirm order? type \'Yes\' to confirm, 0 to cancel order'))
                        // state = 'confirm order'
                    }
                    break;

                case '98':
                    const ordersInDB = await User.findById(user._id).select('orders')
                    
                    if (ordersInDB.orders.length === 0){
                        socket.emit('message', new Message('bot', 'nothing to display'))
                        
                    } else {
                       
                        const orderIds = ordersInDB.orders
                        const order_hist = await Order.find({ _id: { $in: orderIds } }).populate('items', {name: 1, price: 1});
                        
                        socket.emit('order history', order_hist)
                        
                    }
                    
                    socket.emit('main menu', 'return to main menu')

                    state = ''
                    break;

                case '97':
                    if (current_order.length === 0){ 
                        socket.emit('current order', new Message('bot', 'Your currently do not have any orders'))

                    } else {
                        socket.emit('current order', [new Message('bot', 'Your current order:'), current_order])
                    }
                    socket.emit('main menu', 'return to main menu')
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

    socket.on("disconnect", () => {
        console.log('client disconnected')
    })

    socket.on("session-end", (text) => {
        socket.emit("ended-session", 'session ended')
        socket.disconnect()
        socket.request.session.destroy()
    })
})



server.listen(port, () => {
    console.log(`server started on port ${port}`)
})