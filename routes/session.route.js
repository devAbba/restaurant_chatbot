const express = require('express');
const User = require('../models/users.model');

const sessionRouter = express.Router();

sessionRouter.post('/', async (req, res, next) => {
    try {
        const { name, phone } = req.body
        const userFound = await User.findOne({phone: phone })

        if (!userFound){
            const user = new User({
                name,
                phone
            })
    
            const savedUser = await user.save()
            req.session.user_info = savedUser._id

            next()
        } else {
            req.session.user_info = userFound._id
            next()
        }     
        

    } catch (error){
        console.log(error)
        res.redirect('/')
    }
});

module.exports = sessionRouter;