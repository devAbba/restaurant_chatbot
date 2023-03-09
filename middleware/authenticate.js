const authenticate = function (req, res, next){
    if (req.session.user_info){
        next()
    }
    else {
        // res.redirect('/')
        res.end()
        
    }
    
}

module.exports = authenticate