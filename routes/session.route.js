const express = require('express');
const User = require('../models/users.model');

const sessionRouter = express.Router();

sessionRouter.post('/', async (req, res, next) => {
    try {
        const { name, phone, address } = req.body
        const userFound = await User.findOne({phone: phone })

        if (!userFound){
            const user = new User({
                name,
                phone,
                address
            })
    
            const savedUser = await user.save()
            req.session.user_info = savedUser._id

            next()
        } else {
            req.session.user_info = userFound._id
            next()
        }     
        

    } catch (error){
        // res.redirect('/')
        console.log(error)
    }
});

module.exports = sessionRouter;