const { Schema, model } = require('mongoose');

const ObjectId = Schema.ObjectId

const userSchema = new Schema({
    id: ObjectId,
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true
    },
    orders: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Order'
        }
    ]
});


const User = model('User', userSchema);

module.exports = User