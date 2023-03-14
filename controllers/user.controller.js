const User = require('../models/users.model')

exports.getUser = async function (req, res, id){
    try {
        const user = await User.findById(id)
        return user
    }
    catch(error){
        next('unexpected error')
    }
    
}