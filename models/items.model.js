const { Schema, model } = require('mongoose');
const ObjectId = Schema.ObjectId

const itemSchema = new Schema({
    id: ObjectId,
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: String,
    inStock: {
        type: Number,
        required: false
    }
    
}, { timestamps: true });


const Item = model('Item', itemSchema);

module.exports = Item;