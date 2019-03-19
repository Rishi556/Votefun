var express = require('express');
const bodyParser = require('body-parser');
var fs = require("fs")
var whitelist = require("./whitelist.js")
var app = express();
var router = express.Router()
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json());

app.use(router)

var password = ""

router.get('', function(req, res) {
    console.log(password)
    if (req.headers.password == password) {
        res.json({
            "message": "Success"
        })
    } else {
        res.json({
            "message": "Incorrect Password"
        })
    }
})

router.get('/whitelist', function(req, res) {
    if (req.headers.password == password) {
        fs.readFile("whitelist.json", function(err, data) {
            if (!err) {
                var jsonWhitelist = JSON.parse(data)
                res.json(jsonWhitelist)

            }
        })
    } else {
        res.json({
            "message": "Incorrect Password"
        })
    }
})

router.post("/whitelist", function(req, res) {
    if (req.headers.password == password) {

        if (req.body.activity == "add") {
            let user = req.body.user
            whitelist.addToWhitelist(user.toLowerCase(), null)
            res.json({
                "message": "Added"
            })
        }

        if (req.body.activity == "remove") {
            let user = req.body.user
            whitelist.removeFromWhitelist(user.toLowerCase(), null)
            res.json({
                "message": "Removed"
            })
        }
    }
})

router.get('/settings', function(req, res) {
    if (req.headers.password == password) {
        fs.readFile("config.json", function(err, data) {
            if (!err) {
                var jsonWhitelist = JSON.parse(data)
                delete jsonWhitelist["privatePostingKey"]
                delete jsonWhitelist["discordToken"]
                delete jsonWhitelist["privateActiveKey"]
                delete jsonWhitelist["apiPassword"]
                delete jsonWhitelist["_comment1"]
                res.json(jsonWhitelist)

            }
        })
    } else {
        res.json({
            "message": "Incorrect Password"
        })
    }
})

router.post("/settings", function(req, res) {
    if (req.headers.password == password) {
        var toChangeSetting = req.body.setting
        var newSettingValue = req.body.newValue

        fs.readFile("config.json", function(err, response) {
            var currentConfig = JSON.parse(response)
            var typeOfCurrentSetting = typeof(currentConfig[toChangeSetting])
            typeOfCurrentSetting = typeOfCurrentSetting.toString()

            if (typeOfCurrentSetting == "boolean") {
                newSettingValue = newSettingValue.toLowerCase()
                    if (newSettingValue == "true") {
                        currentConfig[toChangeSetting] = true
                        fs.writeFile('config.json', JSON.stringify(currentConfig, null, 2), function(err) {
                            if (!err) {
                                res.json({
                                    "message": "Sucess"
                                })
                            } else {
                                res.json({
                                    "message": "Try Again. That didn't work."
                                })
                            }

                        })
                    } else if (newSettingValue == "false") {
                        currentConfig[toChangeSetting] = false
                        fs.writeFile('config.json', JSON.stringify(currentConfig, null, 2), function(err) {
                            if (!err) {
                                res.json({
                                    "message": "Sucess"
                                })
                            } else {
                                res.json({
                                    "message": "Try Again. That didn't work."
                                })
                            }

                        })
                    } else {
                        res.json({
                            "message": "Try Again. That didn't work."
                        })
                    }
            }

            if (typeOfCurrentSetting == "number") {
                newSettingValue = parseFloat(newSettingValue)
                if (!isNaN(newSettingValue)) {
                    currentConfig[toChangeSetting] = newSettingValue
                    fs.writeFile('config.json', JSON.stringify(currentConfig, null, 2), function(err) {
                        if (!err) {
                            res.json({
                                "message": "Sucess"
                            })
                        } else {
                            res.json({
                                "message": "Try Again. That didn't work."
                            })
                        }

                    })
                }
                else {
                    res.json({
                        "message": "Try Again. That didn't work."
                    })
                }
               
                
            }

            if (typeOfCurrentSetting == "string") {
                currentConfig[toChangeSetting] = newSettingValue
                fs.writeFile('config.json', JSON.stringify(currentConfig, null, 2), function(err) {
                    if (!err) {
                        res.json({
                            "message": "Sucess"
                        })
                    } else {
                        res.json({
                            "message": "Try Again. That didn't work."
                        })
                    }

                })
            }

        })


    }
})



function start() {
    app.listen(8080)
    setInterval(function() {
        fs.readFile("config.json", function(err, data) {
            if (!err) {
                var properData = JSON.parse(data)
                password = properData.apiPassword
            }
        })
    }, 1 * 1000)
}

module.exports = {
    start: start
}