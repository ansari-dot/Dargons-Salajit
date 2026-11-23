const disposableDomains = require("disposable-email-domains");

const checkDisposableEmail = (email)=>{
    const domain = email.split("@").pop().toLowerCase()

    return disposableDomains.includes(domain)
}


module.exports = checkDisposableEmail;