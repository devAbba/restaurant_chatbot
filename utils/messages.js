const moment = require('moment')

class Message {
    constructor (username, text){
        this.username = username
        this.text = text
        this.time = moment().format('h:mm a')
    }
}


module.exports = Message