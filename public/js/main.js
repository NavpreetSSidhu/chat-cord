const chatForm = document.getElementById('chat-form');
const chatMessagesDiv = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');

//Get username and room from url

const {username, room} = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});



const socket = io();

// Join chatroom
socket.emit('joinRoom', {username, room});

// Get room and users
socket.on('roomUsers', ({room, users}) => {
    outputRoomName(room);
    outputUser(users);
});

//Message from server
socket.on('message', (message) =>{
    console.log(message);
    outputMessage(message);

    //scroll down to chatT
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
});

// Message submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    //get message text
    const msg = e.target.elements.msg.value;

    // msg = msg.trim();

    // if(!msg) {
    //     return false;
    // }

    // emiting a message to the server
    socket.emit('chatmessage',msg);

    //clear the messages
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

//output server to DOM
function outputMessage(message) {
    const div = document.createElement('div');
    // gives classes of all the message div
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">
      ${message.text}
    </p>`;
    // add div of every new message
    document.querySelector('.chat-messages').appendChild(div);
}

// add room name to dom
function outputRoomName(room) {
    roomName.innerText = room;
}

// add user names to dom 
function outputUser(users) {
    userList.innerHTML = `
    ${users.map(user => `<li>${user.username}</li>`).join('')}`;
}

// Prompt user before leaving the room
document.getElementById('leave-btn').addEventListener('click', () => {
    const leaveRoom = confirm('Are you sure want to leave the room?');
    if(leaveRoom) {
        window.location = '../index.html';
    }
})