const authConnection = function(socket, next) {
    
   const req = socket.request
   if (!req.session.user_info){
    // socket.emit('ended-session', 'session expired')
    socket.emit('ended session')
    socket.disconnect()
    console.log('session expired')

   }
   next()
  };

const authenticate = function (req, res, next){
    if (req.session.user_info){
        next()
    }
    else {
        res.redirect('/')
    }
    
}

module.exports = {authConnection, authenticate}