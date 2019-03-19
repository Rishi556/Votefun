const Discord = require('discord.js')
var steem = require('steem')
var dsteem = require("dsteem")
var fs = require("fs")
var moment = require("moment")
var request = require("request")
var whitelistjs = require("./whitelist.js")
var api = require("./api")
var helper = require("./helper.js")

var config = {}
var whitelist = []
var times = {}
var messagesToUser = {}

api.start()

var token = config["discordToken"]
var prefix = config["prefix"]
var botCommandRoleName = config["botCommandRole"]
var version = config["version"]
var steemAccount = config["accountName"]
var minTimeWhitelisted = config["minTimeWhitelisted"]
var maxTimeWhitelisted = config["maxTimeWhitelisted"]
var minTimeNotWhitelisted = config["minTimeNotWhitelisted"]
var maxTimeNotWhitelisted = config["maxTimeNotWhitelisted"]
var minimumPowerToVote = config["minimumPowerToVote"]
var extraMessage = config["extraMessage"]
var voteWhiteListed = config["voteWhiteListed"]
var voteNonWhiteListed = config["voteNonWhiteListed"]
var allowComments = config["allowComments"]
var blissfishApiKey = config["blissfishApiKey"]
var leaveComment = config["leaveComment"]
var blacklistedTags = config["blacklistedTags"]
var whitelistOnlyMode = config["whitelistOnlyMode"]

loadConfig()
loadWhitelist()
loadTimes()
updateMessagesToUser()

var client = new dsteem.Client('https://api.steemit.com')

const bot = new Discord.Client();

bot.on('ready', () => {
    console.log('Bot has started');
    bot.user.setActivity(prefix + "help", {
        type: 'PLAYING'
    });
});

bot.on('message', message => {
    if (message.author.bot) return;
    loadConfig()
    loadWhitelist()
    loadTimes()
    updateMessagesToUser()

    var botCommandId = -1
    try {
        botCommandId = message.guild.roles.find("name", botCommandRoleName).id
    } catch (err) {
        console.log("ROLE DOESN't EXIST")
    }

    var isBotCommander = false
    try {
        isBotCommander = message.member.roles.has(botCommandId)
    } catch (err) {
        console.log("Bot Commander Role Failed Somehow")
    }

    if (message.content.indexOf(prefix) === 0) {
        console.log(message.content)
        var afterPrefix = message.content.split(prefix).pop()
        var splitMessage = afterPrefix.split(" ")
        var command = splitMessage[0]
        console.log(command)

        if (command == "help") {
            var messageToSend = replaceVariabledInTextWithValue(messagesToUser.help, message.author.id)
            message.channel.send(messageToSend)
        }

        if (command == "version" || command == "v") {
            var messageToSend = replaceVariabledInTextWithValue(messagesToUser.version, message.author.id)
            message.channel.send(messageToSend)
        }

        if (command == "upvote") {
            steem.api.getAccounts([steemAccount], function(err, response) {
                var secondsago = (new Date - new Date(response[0].last_vote_time + "Z")) / 1000;
                var vpow = response[0].voting_power + (10000 * secondsago / 432000);
                var vp = Math.min(vpow / 100, 100).toFixed(2);
                if (vp >= minimumPowerToVote) {
                    var link = splitMessage[1]
                    var whole = link.split("@").pop()
                    whole = whole.split("/")
                    console.log(whole)
                    let wif = config["privatePostingKey"]
                    let voter = steemAccount
                    let author = whole[0].toLowerCase()
                    var permlink = whole[1]
                    try {
                        permlink = permlink.toLowerCase()
                    } catch (err) {
                        console.log(err)
                        message.channel.send("<@" + message.author.id + "> Error. Please try again." + extraMessage)
                        return
                    }

                    loadTimes()
                    let authorLastVoteDate = times[author]

                    let currentUTC = moment.utc()
                    var differenceVoted = currentUTC.diff(authorLastVoteDate, 'minutes')

                    if (authorLastVoteDate == null) {
                        differenceVoted = 1441
                    }
                    if (differenceVoted >= 1440) {
                        steem.api.getContent(author, permlink, function(err, result) {

                            if (err == null) {
                                var jsonMetadata = JSON.parse(result.json_metadata)
                                var tagsOnPost = jsonMetadata.tags
                                tagsOnPost.push(result.category)
                                blacklistedTags = blacklistedTags.replace(/\s/g, '')
                                blacklistedTags = blacklistedTags
                                var blacklistedTagsArray = blacklistedTags.split(",")
                                var containsMatchingBlacklistedTags = helper.shareAnElement(tagsOnPost, blacklistedTagsArray)

                                var isComment = true

                                if (result.parent_author == "") {
                                    isComment = false
                                }

                                if (!allowComments && isComment) {
                                    message.channel.send("<@" + message.author.id + "> We don't allow comments.")
                                    return
                                }

                                if (containsMatchingBlacklistedTags) {
                                    var messageToSend = replaceVariabledInTextWithValue(messagesToUser.postContaintsBlacklistedTags, message.author.id)
                                    message.channel.send(messageToSend)
                                    return
                                }

                                var time = result["created"]
                                var createdTime = moment.utc(time)
                                var now = moment.utc()
                                var difference = now.diff(createdTime, 'minutes')

                                if (whitelist.includes(author)) {
                                    if (helper.isInRangeInclusinve(minTimeWhitelisted, maxTimeWhitelisted, difference)) {
                                        voteNow(wif, voter, author, permlink, voteWhiteListed * 100, message, true);
                                    } else {
                                        message.channel.send("<@" + message.author.id + "> Posts can only be voted between " + minTimeWhitelisted + " minutes and " + (maxTimeWhitelisted / 1440) + " days for whitelisted authors. This post doesn't meet that requirement." + extraMessage)
                                    }
                                } else {
                                    if (!whitelistOnlyMode) {
                                        if (helper.isInRangeInclusinve(minTimeNotWhitelisted, maxTimeNotWhitelisted, difference)) {
                                            voteNow(wif, voter, author, permlink, voteNonWhiteListed * 100, message, false);
                                        } else {
                                            message.channel.send("<@" + message.author.id + "> Posts can only be voted between " + minTimeNotWhitelisted + " minutes and " + (maxTimeNotWhitelisted / 1440) + " days for non-whitelisted authors. This post doesn't meet that requirement." + extraMessage)
                                        }
                                    } else {
                                        message.channel.send("<@" + message.author.id + "> The bot is in whitelist only mode. Please get whitelisted to use it.")
                                    }
                                }

                            } else {
                                message.channel.send("<@" + message.author.id + "> We couldn't find your post, do you have the right link?")
                            }
                        })
                    } else {
                        var timeLeft = moment.duration(1440 - differenceVoted, "minutes")._data
                        if (timeLeft.days == 0) {
                            message.channel.send("<@" + message.author.id + "> You tried to get a vote too early. Try again later. Minimum 1 day in between votes. Try again in " + timeLeft.hours + " hours and " + timeLeft.minutes + " minutes." + extraMessage)
                        } else {
                            message.channel.send("<@" + message.author.id + "> You tried to get a vote too early. Try again later. Minimum 1 day in between votes. Try again in " + timeLeft.days + "day(s)." + extraMessage)
                        }
                    }

                } else {
                    message.channel.send("<@" + message.author.id + "> " + steemAccount + " has " + vp + "% voting power left. " + steemAccount + " only votes when it has at least " + minimumPowerToVote + "% vp. Please try again once that has been reached. To get the current voting power, use " + prefix + "power." + extraMessage)
                }
            })
        }


        if (command == "power") {
            helper.getVPOfAccount(steemAccount, function(vp) {
                message.channel.send("<@" + message.author.id + "> " + steemAccount + " has " + vp + "% voting power left.")

            })
        }

        if (command == "value") {
            var weight = parseFloat(splitMessage[1])
            if (isNaN(weight) || weight > 100 || 0 > weight) {
                message.channel.send("<@" + message.author.id + "> The proper waay to use this command is `" + prefix + "value {Vote Weight(Between 0.01 and 100)}`. Please try again.")
                return
            }
            steem.api.getRewardFund('post', function(errFunds, responseFunds) {
                var rewardBalance = responseFunds.reward_balance.split(" ")[0]
                var recentClaims = responseFunds.recent_claims
                steem.api.getAccounts([steemAccount], function(errAccount, responseAccount) {
                    var secondsago = (new Date - new Date(responseAccount[0].last_vote_time + "Z")) / 1000;
                    var vpow = responseAccount[0].voting_power + (10000 * secondsago / 432000);
                    var vp = Math.min(vpow / 100, 100).toFixed(2);
                    var shares = parseFloat(responseAccount[0].vesting_shares.split(" ")[0])
                    var recievedShares = parseFloat(responseAccount[0].received_vesting_shares.split(" ")[0])
                    var sentShares = parseFloat(responseAccount[0].delegated_vesting_shares.split(" ")[0])
                    var totalVestingShares = shares + recievedShares
                    totalVestingShares = totalVestingShares - sentShares
                    steem.api.getCurrentMedianHistoryPrice(function(errHistory, resultHistory) {
                        var final_vest = totalVestingShares * 1e6
                        var power = (parseFloat(vp) * parseFloat(weight) / 10000) / 50
                        var rshares = power * final_vest / 10000
                        var estimate = null
                        estimate = (rshares / parseFloat(recentClaims) * parseFloat(rewardBalance) * parseFloat(resultHistory.base.split(" ")[0] / resultHistory.quote.split(" ")[0])) * 10000
                        if (estimate != null) {
                            message.channel.send("<@" + message.author.id + "> " + steemAccount + "'s vote value at " + weight + "% vote weight is estimated to be $" + (Math.round(estimate * 1000) / 1000) + ".")
                        } else {
                            message.channel.send("<@" + message.author.id + "> The proper way to use this command is `" + prefix + "value {Vote Weight(Between 0.01 and 100)}`. Please try again.")
                        }
                    })
                })
            })
        }

        if (command == "add") {
            if (isBotCommander) {
                whitelistjs.addToWhitelist(splitMessage[1].toLowerCase(), message)
            } else {
                message.channel.send("<@" + message.author.id + "> Only the people allowed can add to the whitelist.")
            }
        }

        if (command == "remove") {
            if (isBotCommander) {
                whitelistjs.removeFromWhitelist(splitMessage[1].toLowerCase(), message)
            } else {
                message.channel.send("<@" + message.author.id + "> Only the people allowed can remove from the whitelist.")
            }
        }

        if (command == "change") {
            if (isBotCommander) {
                var toChange = splitMessage[1]
                var changeTo = splitMessage[2]

                if (config[toChange] != null) {
                    var type = typeof(config[toChange]).toString()
                    if (type == "string") {
                        config[toChange] = changeTo.toString()
                        writeConfig()
                    }
                    if (type == "boolean") {
                        if (changeTo == "true") {
                            config[toChange] = true
                            writeConfig()
                        } else if (changeTo == "false") {
                            config[changeTo] = false
                            writeConfig()
                        } else {
                            message.channel.send("<@" + message.author.id + "> This can only be changed to `true` or `false`.")
                        }
                    }
                    if (type == "number") {
                        config[toChange] = parseFloat(number)
                        writeConfig()
                    }
                    console.log(config)

                } else {
                    message.channel.send("<@" + message.author.id + "> That doesn't exist. You sure you have the right name?")
                }
            } else {
                message.channel.send("<@" + message.author.id + "> Only " + botCommandRoleName + " can change configs.")
            }
        }
    }
})

function voteNow(wif, voter, author, permlink, weight, message, member) {
    var key = dsteem.PrivateKey.fromString(wif)
    client.broadcast.vote({
        voter: voter,
        author: author,
        permlink: permlink,
        weight: weight
    }, key).then(function(result) {
        var user = message.author.username

        if (leaveComment) {
            var comment = config["comment"]
            comment = comment.replace(/\{user\}/g, user)
            makeComment(wif, author, permlink, voter, permlink, comment)
        }

        times[author] = moment.utc()
        writeTimes()

        if (member) {
            if (blissfishApiKey != "" || blissfishApiKey != null) {
                sendBlissFishBidWithApi(blissfishApiKey, author, permlink)
            }
            message.channel.send("<@" + message.author.id + "> Sucessfully voted on your post." + extraMessage)
        } else {
            message.channel.send("<@" + message.author.id + "> Sucessfully voted on your post. You aren't whitelisted." + extraMessage)
        }
    }, function(error) {
        var errorMessage = error.message
        message.channel.send("<@" + message.author.id + "> There was an error with message: " + errorMessage + extraMessage)
    })
}

function makeComment(wif, author, permlink, voter, permlink, comment) {
    steem.broadcast.comment(wif, author, permlink, voter, "re-" + permlink, "title", comment, JSON.stringify({
        app: 'Discord'
    }), function(err, result) {
        console.log("Left comment on : " + author + " " + permlink)
    });
}

function sendBlissFishBidWithApi(key, author, permlink) {
    var url = 'http://198.245.55.162:3000/submit';
    var headers = {
        'key': key
    }
    var form = {
        "post": "@" + author + "/" + permlink
    };

    request.post({
        url: url,
        form: form,
        headers: headers
    }, function(e, r, body) {
        console.log(e, r, body)
    })
}

function replaceVariabledInTextWithValue(text, tag){
    var editedText = text
    editedText = editedText.replace(/\{steemAccount\}/g, steemAccount)
    editedText = editedText.replace(/\{prefix\}/g, prefix)
    editedText = editedText.replace(/\{botCommandRoleName\}/g, botCommandRoleName)
    editedText = editedText.replace(/\{userToTag\}/g, tag)
    editedText = editedText.replace(/\{version\}/g, version)
    return editedText
}

function loadConfig() {
    config = JSON.parse(fs.readFileSync("config.json"));
    token = config["discordToken"]
    prefix = config["prefix"]
    botCommandRoleName = config["botCommandRole"]
    version = config["version"]
    steemAccount = config["steemAccount"]
    minTimeWhitelisted = config["minTimeWhitelisted"]
    maxTimeWhitelisted = config["maxTimeWhitelisted"]
    minTimeNotWhitelisted = config["minTimeNotWhitelisted"]
    maxTimeNotWhitelisted = config["maxTimeNotWhitelisted"]
    minimumPowerToVote = config["minimumPowerToVote"]
    extraMessage = config["extraMessage"]
    voteWhiteListed = config["voteWhiteListed"]
    voteNonWhiteListed = config["voteNonWhiteListed"]
    allowComments = config["allowComments"]
    blissfishApiKey = config["blissfishApiKey"]
    leaveComment = config["leaveComment"]
    blacklistedTags = config["blacklistedTags"]
    whitelistOnlyMode = config["whitelistOnlyMode"]
    
}

function updateMessagesToUser() {
    messagesToUser = JSON.parse(fs.readFileSync("messages.json"));
}

function writeConfig() {
    fs.writeFile('config.json', JSON.stringify(config, null, 2), function(err) {})
}

function loadWhitelist() {
    whitelist = JSON.parse(fs.readFileSync("whitelist.json"));
}

function loadTimes() {
    times = JSON.parse(fs.readFileSync("times.json"));
}

function writeTimes() {
    fs.writeFile('times.json', JSON.stringify(times, null, 2), function(err) {})
}


bot.on('error', e => {
    console.log(e)
})


bot.login(token);
