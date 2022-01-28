var socket = io()
var canvas = document.getElementById("canvas")
var ctx = canvas.getContext("2d")
let pen_color = '#000000'
let pen_width = '2'
var speaker = true
var mic = false

const {username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})

canvas.height=3000
canvas.width=window.innerWidth*0.98

let pen = false
function startDraw(event){
    pen = true
    var info = {
        width: ctx.lineWidth,
        style: ctx.strokeStyle,
        x: event.clientX,
        y:event.clientY+window.scrollY,
        pen: 1
    }
    ctx.moveTo(event.clientX, event.clientY+window.scrollY)
    socket.emit('draw', info, (res)=>{
        if(res) return console.log(res)
    })
}
function endDraw(event){
    pen=false
    console.log("ended")
    ctx.beginPath()
    var info = {
        width: ctx.lineWidth,
        style: ctx.strokeStyle,
        x: event.clientX,
        y: event.clientY,
        pen: 0
    }
    ctx.moveTo(event.clientX, event.clientY)
    socket.emit('draw', info, (res)=>{
        if(res) return console.log(res)
    })
}
socket.on('ondraw', (info) => {
    if(info.pen === 0){
        pen = false
        ctx.strokeStyle = info.style
        ctx.beginPath()
        ctx.moveTo(info.x, info.y)
        return
    }
    if(info.pen === 1){
        pen = true
        ctx.beginPath()
        ctx.moveTo(info.x, info.y)
        return
    }

    ctx.lineWidth = info.width
    ctx.strokeStyle = info.style
    ctx.lineTo(info.x, info.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(info.x, info.y)
})
function Draw(event){
    if(!pen) return
    if(event.clientX<9 | event.clientX>1515)
        pen=0
    ctx.lineCap='round'
    var info = {
        width: ctx.lineWidth,
        style: ctx.strokeStyle,
        x: event.clientX,
        y:event.clientY+window.scrollY,
        pen: 2
    }
    ctx.lineWidth = pen_width
    ctx.strokeStyle = pen_color
    socket.emit('draw', info, (res)=>{
        if(res) return console.log(res)
    })
    ctx.lineTo(event.clientX, event.clientY+window.scrollY)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(event.clientX, event.clientY+window.scrollY)
}


function changeWidth(value){
    ctx.lineWidth = value
    pen_width = value
}
function changeColor(value){
    ctx.strokeStyle = value
    pen_color = ctx.strokeStyle
}


canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mousemove", Draw);

socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error)
        location.href = "/"
    }
})

//text chat implementation

var d
var n
let textarea = document.querySelector('#textarea')
let messageArea = document.querySelector('.message__area')

textarea.addEventListener('keyup', (e) => {
    if(e.key === 'Enter') {
        console.log("enter")
        d = new Date()
        n = d.toLocaleTimeString();
        sendMessage(e.target.value)
    }
})

function sendMessage(message) {
    let msg = {
        user: username,
        message: message.trim(),
        time: n
    }
    // Append 
    appendMessage(msg, 'outgoing')
    textarea.value = ''
    scrollToBottom()
    socket.emit('message', msg)

}

function appendMessage(msg, type) {
    let mainDiv = document.createElement('div')
    let className = type
    mainDiv.classList.add(className, 'message')

    let markup = `
        <h4>${msg.user}</h4>
        <p>${msg.message}</p>
        <p id="time">${msg.time}</p>
    `
    mainDiv.innerHTML = markup
    messageArea.appendChild(mainDiv)
}

// Recieve messages 
socket.on('message', (msg) => {
    appendMessage(msg, 'incoming')
    scrollToBottom()
})

function scrollToBottom() {
    messageArea.scrollTop = messageArea.scrollHeight
}
var chatbox = false

function togglechat(){
    chatbox = !chatbox
    if(chatbox){
        document.getElementById("myForm").style.display = "block";
    }
    else{
        document.getElementById("myForm").style.display = "none";
    }
}
document.querySelector(".open-button").addEventListener("click", togglechat)
document.querySelector(".btn-cancel").addEventListener("click", togglechat)
//voice call implementation

window.onload = (e) => {
    mainFunction(500);
};

function mainFunction(time) {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      var mediarecord = new MediaRecorder(stream);
      mediarecord.start();
      var audioChunks = [];
  
      mediarecord.addEventListener("dataavailable", function (event) {
        audioChunks.push(event.data);
      });
  
      mediarecord.addEventListener("stop", function () {
        var audioBlob = new Blob(audioChunks);
  
        audioChunks = [];
  
        var fileReader = new FileReader();
        fileReader.readAsDataURL(audioBlob);
        fileReader.onloadend = function () {
            var base64String = fileReader.result;
            if(mic) socket.emit("voice", base64String);
        };
        mediarecord.start();
        setTimeout(function () {
          mediarecord.stop();
        }, time);
      });
      setTimeout(function () {
        mediarecord.stop();
      }, time);
    });
  
  
    socket.on("send", function (data) {
      var audio = new Audio(data);
      if(speaker) audio.play();
    });
}


function togglespeaker(){
    speaker = !speaker
    if(speaker){
        document.querySelector('#speakeroff').style.display="none"
        document.querySelector('#speakeron').style.display="block"
    }
    else{
        document.querySelector('#speakeron').style.display="none"
        document.querySelector('#speakeroff').style.display="block"
    }
}

function togglemic(){
    mic = !mic
    if(mic){
        document.querySelector('#micoff').style.display="none"
        document.querySelector('#micon').style.display="block"
    }
    else{
        document.querySelector('#micon').style.display="none"
        document.querySelector('#micoff').style.display="block"
    }
}

document.querySelector('.speaker').addEventListener("click",togglespeaker)
document.querySelector('.mic').addEventListener("click",togglemic)


var userbox=false
function toggleuserbox(){
    userbox = !userbox
    if(userbox)
    document.querySelector('.users').style.display="block"
    else
    document.querySelector('.users').style.display="none"
}

document.querySelector(".user-btn").addEventListener("click", toggleuserbox)



function userslist(users){
    let mainDiv = document.createElement('div')
    let markup = `<ul>`
    users.forEach(user =>{
        if(user.username == username.trim().toLowerCase())
            markup += `<li style="color: red">${username}</li>`
        else
            markup += `<li>${user.username}</li>`
    })
    markup += '</ul>'
    document.querySelector('.user__area').innerHTML =markup
}
console.log(`username is ${username}`)
socket.on('userlist',(users) => {
    userslist(users)
})