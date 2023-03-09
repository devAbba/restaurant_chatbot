const express = require('express');

const sessionRouter = express.Router();

sessionRouter.post('/', (req, res, next) => {
    try {
        const { name, email, phone, address } = req.body

        req.session.user_info = {
            name, 
            email, 
            phone, 
            address
        }    
        next() 
    }
    catch (error){
        next()
    }

});

module.exports = sessionRouter;