const { Schema, model } = require('mongoose');

const itemSchema = new Schema({
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
        required: true
    },
    timestamps: true
});

const Item = model('Item', itemSchema);

module.exports = Item;