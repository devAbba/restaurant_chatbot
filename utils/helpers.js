const Message = require('./messages')
const Order = require('../models/orders.model')
const User = require('../models/users.model');
const Item = require('../models/items.model');

//initialize default state
let state = ''
let current_selection = []
let current_order = []
let address;

async function handleSelection (socket, io, msg, items, user){
  try {
    const userId = socket.request.session.user_info
    const session_id = socket.request.session.id
    

    if (state === 'food menu'){
        switch (msg.toLowerCase()){
            case 'start':
                io.to(session_id).emit('main menu', 'return to main menu')
                state = ''
                break;
            default:

        //use a single pattern regex for non comma separated input         
        if (msg.indexOf(',') === -1){
            const patterns = [new RegExp(msg, 'i')]
        } 

        //create an array of regex patterns by default
        let selection = msg.split(',')
        selection = selection.map(item => item.trim())
        const patterns = selection.map(i => new RegExp(i, 'i'))

        //filter food items to match pattern
        const matches = items.filter((item) => {
            return patterns.some((pattern) => {
              return pattern.test(item.name);
            });
        });  
        
        //return invalid input if no match found
        if (matches.length === 0){ 
            io.to(session_id).emit('invalid input', new Message('bot', 'invalid input. Try again')) 
            state = 'food menu'
        } else {
            //create object with id, name and price of item and add to current selection
            matches.forEach(item => {
                current_selection.push({id: item._id,'name': item.name, 'price': item.price})
            })

            //change state
            state = 'confirm entry'
            io.to(session_id).emit('confirm entry', [new Message('bot', 'Your current selection. Type \'Yes\' if it\'s correct and \'No\' if it isn\'t'), current_selection])
        }
        }
    }
    else if (state === 'confirm entry'){
        switch (msg.toLowerCase()){
            case 'start':
                io.to(session_id).emit('main menu', 'return to main menu')
                state = ''
                break;
    
            case 'yes':
                //current selection added to orders (cart) on entry confirmation
                current_order.push(current_selection)

                //empty current selection array
                current_selection = []

                io.to(session_id).emit('add order', new Message('bot', 'would you like to place another order? Yes/No'))
                state = 'add order'
                break;
            case 'no':
                //empty current selection array
                current_selection = []

                io.to(session_id).emit('redo order entry', new Message('bot', 'make your selection again. Be sure to use the same spellings as shown on the menu'))
                state = 'food menu'
                break;
            default:
                io.to(session_id).emit('invalid input', new Message('bot', 'invalid input. Try again'))
        }
    }
    else if (state === 'add order'){
        switch (msg.toLowerCase()){
            case 'start':
                io.to(session_id).emit('main menu', 'return to main menu')
                state = ''
                break;
            
            case 'yes':
                state = 'food menu'
                io.to(session_id).emit('items', [items, new Message('bot', 'Here is a list of items you can choose from. \n Make your selection by typing out the name of the item as shown below, seperated with commas')])
                break;
            case 'no':
                state = ''
                io.to(session_id).emit('main menu', 'return to main menu')
                break;
            default:
                io.to(session_id).emit('invalid input', new Message('bot', 'invalid input. Try again'))
        }
    }
    else if (state === 'address'){
        switch (msg.toLowerCase()){
            case 'start':
                //return to start menu if user input corresponds to start
                io.to(session_id).emit('main menu', 'return to main menu')
                state = ''
                break;

            default:
                //user input assigned as address
                address = msg
                io.to(session_id).emit('confirm order', new Message('bot', 'Confirm order? type \'Yes\' to confirm, 0 to cancel order'))
                state = 'confirm order'
        }
    }
    else if (state === 'confirm order'){
       switch (msg.toLowerCase()){
            case 'start':
                io.to(session_id).emit('main menu', 'return to main menu')
                state = ''
                break;
        
            case 'yes':
                // current order holds an array of arrays, with each array representing an order
                //create an array of arrays holding just the item ids
                const idsArr = current_order.map(order => order.map(({id}) => (id)))
            
                try {
                    const userInDB = await User.findById(userId);

                    //for each 'order' array, save new order in db, items is an array of item ids
                    const orderPromises = idsArr.map(async order => {
                        const orderToSave = new Order({createdBy: user._id, delivery_address: address, items: order})
                        const savedOrder = await orderToSave.save()
                        userInDB.orders = userInDB.orders.concat(savedOrder._id)
                        
                    })
                    
                    //resolved as promises to avoid version key error
                    const savedOrders = await Promise.all(orderPromises)
                    await userInDB.save()

                } catch (error){
                    
                }
            
                io.to(session_id).emit('order confirmed', new Message('bot', `Your order has been confirmed and will be dispatched to ${address}`))
                io.to(session_id).emit('main menu', 'return to main menu')
               
                //empty current order after checking out
                current_order = []
                state = ''
                break;

            case '0':
                //cancel order and empty cart
                current_order = []
                io.to(session_id).emit('cancel order', new Message('bot', "Your order has been cancelled"))
                io.to(session_id).emit('main menu', 'return to main menu')
                state = ''
                break;

            default:
                io.to(session_id).emit('invalid input', new Message('bot', 'invalid input. Try again'))
       }
    }
    
    else {
        switch (msg){
            case '1':
                if(!state){
                    //create new object with just item name and price and send to client
                    const itemsTrimmed = items.map(item => { 
                        return {'name': item.name, 'price': item.price}
                    })
                    io.to(session_id).emit('items', [itemsTrimmed, new Message('bot', 'Here is a list of items you can choose from. \n Make your selection by typing out the name of the item as shown below, seperated with commas')])  
                    state = 'food menu'
                }
                break;

            case '99':
                if (current_order.length === 0){
                    io.to(session_id).emit('no selections', new Message('bot', 'you currently do not have any selections. Please place an order before checking out'))
                    io.to(session_id).emit('main menu', 'return to main menu')
                    state = ''
                } else {
                    let total = 0;
                    current_order.forEach((item) => {
                        item.forEach(prop => {
                            total += prop.price
                        })
                    })
                    io.to(session_id).emit('checkout', new Message('bot', `Your order total: #${total} \n Delivery fee: #1000 \n Total: #${total + 1000}`))
                    io.to(session_id).emit('address', new Message('bot', 'Please enter your delivery address'))
                    state = 'address'
                    
                }
                break;

            case '98':
                //get user's orders from db
                const ordersInDB = await User.findById(userId).select('orders')
                
                if (ordersInDB.orders.length === 0){
                    io.to(session_id).emit('message', new Message('bot', 'nothing to display'))
                    
                } else {
                   
                    const orderIds = ordersInDB.orders

                    //query db with array of ids and populate with name and price of items
                    const order_hist = await Order.find({ _id: { $in: orderIds } }).populate('items', {name: 1, price: 1});
                    
                    io.to(session_id).emit('order history', order_hist)
                    
                }
                
                io.to(session_id).emit('main menu', 'return to main menu')

                state = ''
                break;

            case '97':
                if (current_order.length === 0){ 
                    io.to(session_id).emit('current order', new Message('bot', 'Your currently do not have any orders'))

                } else {
                    io.to(session_id).emit('current order', [new Message('bot', 'Your current order:'), current_order])
                }
                io.to(session_id).emit('main menu', 'return to main menu')
                break;

            case '0':
                if (current_order.length === 0) io.to(session_id).emit('message', new Message('bot', 'you have no items in your list'))
                else{
                    current_order = []
                    io.to(session_id).emit('cancel order', new Message('bot', "Your order has been cancelled"))
                }
                io.to(session_id).emit('main menu', 'return to main menu')
                state = ''
                break;
            case 'start':
                io.to(session_id).emit('main menu', 'return to main menu')
                state = ''
                break;
            default:
                io.to(session_id).emit('invalid input', new Message('bot', 'invalid input. Try again'))

        }
    }
  } catch (err){

  } 
}

module.exports = handleSelection