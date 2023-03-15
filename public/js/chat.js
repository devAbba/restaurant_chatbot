let dateOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }

const form = document.getElementById('order-form')
const input = document.getElementById('order-input')
const messages = document.getElementById('messages')
const sessionEnd = document.getElementById('session-control')

var socket = io()

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
      socket.emit('chat message', input.value);
      input.value = '';
    }
});

sessionEnd.addEventListener('click', function(){
    socket.emit("session-end", 'ended session')
    
})


socket.emit('joinRoom', '')

socket.on('message', function (msg){
    outputMessage(msg, 'left')
})

socket.on('welcome', function (msg){
    outputMessage(msg, 'left')
    showMenue()
})

socket.on('user input', function (msg){
    outputMessage(msg, 'right')    
});
 
socket.on('invalid input', function (msg){
    outputMessage(msg, 'left')
})

socket.on('main menu', function (){
    showMenue()
})

socket.on('items', function (msg){
    outputMessage(msg[1], 'left')
    renderObjects(msg[0])
})

socket.on('no selections', function (msg){
    outputMessage(msg, 'left')
})

socket.on('confirm entry', function (msg){
    outputMessage(msg[0], 'left')
    renderObjects(msg[1])
})

socket.on('redo order entry', function (msg){
    outputMessage(msg, 'left')
})

socket.on('add order', function (msg){
    outputMessage(msg, 'left')
})

socket.on('checkout', function (msg){
    outputMessage(msg, 'left')
})

socket.on('address', function (msg){
    outputMessage(msg, 'left')
})

socket.on('confirm order', function (msg){
    outputMessage(msg, 'left')
})

socket.on('order confirmed', function (msg){
    outputMessage(msg, 'left')
})

socket.on('order history', function (obj){
    const dt = new Date(obj[0].createdAt)
    console.log(dt.toLocaleString('en-US', dateOptions))

    const div = document.createElement('div');
    div.classList.add('message');
    div.classList.add('left');
    div.innerHTML = obj.map(order => (
        `<div class="history-group">
            <p>${new Date(order.createdAt).toLocaleDateString('en-us', dateOptions)}</p>
            <ul>
            ${order.items.map(item => `<li>${item.name}</li>`).join('')}
          </ul>
        </div>`
    )).join('')
    document.getElementById('messages').appendChild(div);    
    window.scrollTo(0, document.body.scrollHeight);
})

socket.on('current order', function (msg){
    if (Array.isArray(msg)){
        outputMessage(msg[0], 'left')
        msg[1].forEach(function(order){
            renderObjects(order)
        }) 
    } else {
        outputMessage(msg, 'left')
    }
})

socket.on('cancel order', function (msg){
    outputMessage(msg, 'left')
})


socket.on('ended-session', function (msg){
    const div = document.createElement('div');
    div.classList.add('end-message')
    div.innerHTML = `<p>${msg}</p>`
    document.getElementById('messages').appendChild(div);
    window.scrollTo(0, document.body.scrollHeight);
    sessionEnd.style.display = "none"
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
    div.classList.add('message');
    div.classList.add('left');
    div.innerHTML = `<ul>
        <li>Select 1 to Place an order</li>
        <li>Select 99 to checkout order</li>
        <li>Select 98 to see order history</li>
        <li>Select 97 to see current order</li>
        <li>Select 0 to cancel order</li>
    </ul>`
    document.getElementById('messages').appendChild(div);
    window.scrollTo(0, document.body.scrollHeight);

    socket.emit('main menue', 'main menue displayed')
}

function renderObjects (objArray){
    const div = document.createElement('div');
    div.classList.add('message');
    div.classList.add('left');
    div.innerHTML = objArray.map(item => (
        `<div>
            <p>${item.name},  price: #${item.price}</p>
        </div>`
    )).join('')
    document.getElementById('messages').appendChild(div);    
    window.scrollTo(0, document.body.scrollHeight);
    
}

const tooltips = document.querySelectorAll('.tt');
tooltips.forEach(t => {
    new bootstrap.Tooltip(t);
})

