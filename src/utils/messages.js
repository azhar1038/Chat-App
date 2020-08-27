const generateMessage = (username, text)=>{
    return {
        username,
        text,
        at: new Date().getTime()
    }
}

const generateLocationMessage = (username, location)=>{
    return {
        username,
        location,
        at: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}