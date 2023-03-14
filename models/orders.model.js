const { Schema, model } = require('mongoose')

const ObjectId = Schema.ObjectId

const orderSchema = new Schema({
    id: ObjectId,
    delivery_info: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    items: [
        [   {
            type: Schema.Types.ObjectId,
            ref: 'Item'
            }
        ]
    ],
    status: { 
        type: String, 
        enum: ['order created', 'processing', 'fulfilled'],
        default: 'order created'
    }
})

const Order = model('Order', orderSchema)

module.exports = Order