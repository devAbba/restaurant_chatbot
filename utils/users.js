const users = []

function userJoin(username, room) {
    const user = {username, room };
  
    users.push(user);
  
    return user;
}
  
// Get current user
function getCurrentUser(username) {
    return users.find(user => user.username === username);
}

// Get room users
function getRoomUsers(room) {
    return users.filter(user => user.room === room);
}

module.exports = { userJoin, getCurrentUser, getRoomUsers }