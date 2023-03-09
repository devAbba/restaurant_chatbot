var socket = io()

socket.on("connected", function (msg){
    console.log(msg)
    outputMessage(msg, 'left')
    showMenue()
})

const form = document.getElementById('order-form')
const input = document.getElementById('order-input')
const messages = document.getElementById('messages')
const sessionEnd = document.getElementById('session-control')

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
      socket.emit('chat message', input.value);
      input.value = '';
    }
});

sessionEnd.addEventListener('click', function(){
    
    socket.emit("session-end", 'ended session')
    sessionEnd.style.display = "none"
})

socket.on('chat message', function(msg) {
   outputMessage(msg, 'right')
});

socket.on('ended-session', function (msg){
    const div = document.createElement('div');
    div.classList.add('end-message')
    div.innerHTML = `<p>${msg}</p>`
    document.getElementById('messages').appendChild(div);
    window.scrollTo(0, document.body.scrollHeight);
})

function outputMessage (message, className){
    const div = document.createElement('div');
    div.classList.add('message')
    div.classList.add(`${className}`)
    div.innerHTML = `<p class="meta">${message.username}<span> ${message.time} </span>
        </p><p>${message.text}</p>`
    document.getElementById('messages').appendChild(div);
    window.scrollTo(0, document.body.scrollHeight);
}

function showMenue (){
    const div = document.createElement('div');
    div.classList.add('message')
    div.classList.add('left')
    div.innerHTML = `<ul>
        <li>Select 1 to Place an order</li>
        <li>Select 99 to checkout order</li>
        <li>Select 98 to see order history</li>
        <li>Select 97 to see current order</li>
        <li>Select 0 to cancel order</li>
    </ul>`
    document.getElementById('messages').appendChild(div);
    window.scrollTo(0, document.body.scrollHeight);
}

const tooltips = document.querySelectorAll('.tt')
tooltips.forEach(t => {
    new bootstrap.Tooltip(t)
})