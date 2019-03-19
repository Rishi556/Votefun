var fs = require("fs")

function addToWhitelist(user, message) {
    var whitelist = JSON.parse(fs.readFileSync("whitelist.json"));
    if (whitelist.includes(user)) {
        if (message != null) {
            message.channel.send("<@" + message.author.id + "> " + user + " is already in the whitelist.")
        }
    } else {
        whitelist.push(user)
        fs.writeFile('whitelist.json', JSON.stringify(whitelist, null, 2), function(err) {
            if (err == null) {
                if (message != null) {
                    message.channel.send("<@" + message.author.id + "> Sucessfully added " + user + " to whitelist.")
                } else {
                    if (message != null) {
                        message.channel.send("<@" + message.author.id + "> Error adding " + user + " to whitelist. Please try again")
                    }
                }
            }
        })
    }
}

function removeFromWhitelist(user, message) {
    var whitelist = JSON.parse(fs.readFileSync("whitelist.json"));
    if (whitelist.includes(user)) {
        var aIndex = whitelist.indexOf(user)
        if (aIndex > -1) {
            whitelist.splice(aIndex, 1);
            fs.writeFile('whitelist.json', JSON.stringify(whitelist, null, 2), function(err) {
                if (message != null) {
                if (err == null) {
                    
                        message.channel.send("<@" + message.author.id + "> Sucessfully remvoed " + user + " from whitelist.")
                    } else {
                        message.channel.send("<@" + message.author.id + "> Error removing " + user + " from whitelist. Please try again")
                    }
                }
            })
        }
    } else {
        if (message != null) {
            message.channel.send("<@" + message.author.id + "> " + user + " is not in the whitelist.")
        }
    }
}

module.exports = {
    addToWhitelist: addToWhitelist,
    removeFromWhitelist: removeFromWhitelist
}