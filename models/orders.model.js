const { Schema, model } = require('mongoose')

const ObjectId = Schema.ObjectId

const orderSchema = new Schema({
    id: ObjectId,
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    delivery_address: {
        type: String 
    },
    items: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Item'
        }
        
    ],
    status: { 
        type: String, 
        enum: ['order created', 'processing', 'fulfilled'],
        default: 'order created'
    }
}, {timestamps: true})

const Order = model('Order', orderSchema)

module.exports = Order