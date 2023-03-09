var socket = io()

socket.on("connected", function (msg){
    console.log(msg)
})