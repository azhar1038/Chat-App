const socket = io()

const $chatForm = document.getElementById('chat-form')
const $chatFormInput = $chatForm.querySelector('input')
const $chatFormButton = $chatForm.querySelector('button')
const $sendLocationButton = document.getElementById('send-location')
const $messages = document.getElementById('messages')
const $sidebar = document.getElementById('sidebar')

const $messageTemplate = document.getElementById('message-template').innerHTML
const $locationTemplate = document.getElementById('location-template').innerHTML
const $sidebarTemplate = document.getElementById('sidebar-template').innerHTML

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = ()=>{
    const $newMessage = $messages.lastElementChild
    
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message)=>{
    console.log(message)
    const html = Mustache.render($messageTemplate, {
        username: message.username,
        message: message.text,
        at: moment(message.at).format("hh:mm A")
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message)=>{
    console.log(location)
    const html = Mustache.render($locationTemplate, {
        username: message.username,
        location: message.location,
        at: moment(message.at).format("hh:mm A")
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users})=>{
    console.log(users)
    const html = Mustache.render($sidebarTemplate,{
        room,
        users
    })
    $sidebar.innerHTML = html
})

$chatForm.addEventListener('submit', (e)=>{
    e.preventDefault()

    $chatFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error)=>{

        $chatFormButton.removeAttribute('disabled')
        $chatFormInput.value=''
        $chatFormInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('Message Delivered')
    })
})

$sendLocationButton.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        return alert("This feature is not supported by your browser!")
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')


    navigator.geolocation.getCurrentPosition((position)=>{

        $sendLocationButton.removeAttribute('disabled')

        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        }, ()=>{
            console.log('Location shared!')
        })
    })

//     navigator.permissions.query({name:'geolocation'}).then((result) => {
//         if (result.state !== 'granted') {
//             $sendLocationButton.removeAttribute('disabled')
//         }
//    })
})

socket.emit('join', {username, room}, (error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})