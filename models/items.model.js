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

itemSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
      }
})

const Item = model('Item', itemSchema);

module.exports = Item;