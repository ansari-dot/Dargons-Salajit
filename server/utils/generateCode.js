const crypto = require('crypto')

const generateCode = async()=>{
    return crypto.randomInt(0,1000000).toString().padStart(6,'0')
}

module.exports = generateCode;