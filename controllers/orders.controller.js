const Order = require('../models/orders.model');
const User = require('../models/users.model');
const Item = require('../models/items.model');

exports.createOrder = async function (req, res, next){
    try {
        const items = 'orderItems'
        const userDetail = req.session.user_info
        const user = new User(userDetail)
        const savedUser = await user.save()

        const order = new Order(items)
        const savedOrder = await order.save()
        //current order would be savedOrder.id

        const userInDb = await User.findById(savedUser.id)
        userInDb.orders = userInDb.orders.concat(savedOrder.id)

    }
    catch (error){
        next()
    }
}

exports.getOrder = async function (req, res){
    try {
        const id = 'current order id' //savedOrder.id
        const order = await Order.findById(id)
        socket.emit('show order', order)
        //on event display to the client the order details
    }
    catch (error){
        next()
    }
}

exports.cancelOrder = async function (req, res){
    try {
        const id = 'current order id' //savedOrder.id
        Order.findByIdAndDelete(id)
        socket.emit('order cancelled', id)
        //on event display to user that order with the id has been cancelled
    }
    catch (error){
        next()
    }
}

exports.getItems = async function (req, res){
    try {
        const items = await Item.find()
        
    }
    catch (error){
        next()
    }
}