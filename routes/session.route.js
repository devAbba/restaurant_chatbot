const express = require('express');
const User = require('../models/users.model');

const sessionRouter = express.Router();

sessionRouter.post('/', async (req, res, next) => {
    try {
        //search for user in db based on phone number
        const { name, phone } = req.body
        const userFound = await User.findOne({phone: phone })

        //create user entry into db if user doesn't exist
        if (!userFound){
            const user = new User({
                name,
                phone
            })
    
            const savedUser = await user.save()
            
            //save user id in session cookie
            req.session.user_info = savedUser._id

            
        } else {
            //save user id from db in session cookie
            req.session.user_info = userFound._id
            
        }     
        
        next()
    } catch (error){
        console.log(error)
        res.redirect('/')
    }
});

module.exports = sessionRouter;