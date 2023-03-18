const mongoose = require('mongoose');

const connectDB = function (url){
    mongoose.connect(url)

    mongoose.connection.on('connected', () => {
        console.log("connected to mongodb")
    });

    mongoose.connection.on('error', (err) => {
        console.log(err)
    });
}

module.exports = connectDB;