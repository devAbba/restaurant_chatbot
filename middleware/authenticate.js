const authenticate = function (req, res, next){
    if (req.session.user_info){
        next()
    }
    else {
        res.redirect('/')
    }
    
}

const authConnection = function (socket, next){
    if (!socket.request.session || !socket.request.session.user_info){
        console.log("unauthorized request")
        const err = new Error("not authorized")
        err.data = { content: "unauthorized connection" }
        next(err);
        
    } else {
        next()
    }
}

module.exports = { authenticate, authConnection }