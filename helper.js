// MATH STUFF

function isInRangeInclusinve(min, max, num) {
    if (num >= min && num <= max){
        return true
    } else {
        return false
    }
}

// Other
function shareAnElement(arrayOne, arrayTwo){
    var match = false
    for (iOne in arrayOne){
        var currentElement = arrayOne[iOne].toLowerCase()
        for (iTwo in arrayTwo){
            if (currentElement == arrayTwo[iTwo].toLowerCase()){
                match = true
            }
        }
    }
    return match
}

//STEEM STUFF
var steem = require("steem")

steem.api.setOptions({url: 'https://anyx.io'})

function getVPOfAccount(account, callback){
    steem.api.getAccounts([account], function (err, response) {
        var secondsago = (new Date - new Date(response[0].last_vote_time + "Z")) / 1000;
        var vpow = response[0].voting_power + (10000 * secondsago / 432000);
        var vp = Math.min(vpow / 100, 100).toFixed(2);
        callback(vp)
    })
}

module.exports = {
    isInRangeInclusinve : isInRangeInclusinve,
    shareAnElement: shareAnElement,
    getVPOfAccount: getVPOfAccount
}