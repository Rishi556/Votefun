# Votefun

How to use:

1. Have a steem account for this, will require the private posting key.
2. Create a discordbot and get the token for it.
3. Clone files
4. Edit config-exmaple.json with your details then rename it to config.json.
5. Open terminal and cd to the directory.
6. `npm install` to install the dependencies.
7. `node .` to start running the bot. 
8. Head to your discord server and enjoy.


Usage on Discord:

1. Have post link. Any site that follows the @author/permlink will work (steemit/busy both work)
2. Go to the channel with the bot. 
3. Make sure post meets all the requirements set by the owner of the server (currently min/max time only). 
4. Type in the prefix(set by owner) and upvote. Then paste in the post link and send the message.
5. Wait for confirmation message. Enjoy your vote.

The whitelist should consist of STEEM account names, not discord names.

Here's how the config file should be formatted. 
```
{
    "accountName" : "TheIsTheSteemAccountName", # This is the account name on the steem blockchain that the voting will happen form.
    
    "privatePostingKey" : "5ThisIsThePrivatePostingKey", # This is the private posting key for the account.
    
    "comment" : "This is the comment.", # This is the comment that the bot will leave on the posts that it votes.
    
    "discordToken" : "ThisIsTheDsicordToken", # This is the discord token of the discordbot. Head to https://discordapp.com/developers/applications/me to get one.
    
    "prefix" : "$", # This is the prefix for the bot on the discord server. This is the character that users will have to put before their command if it wants to get registered by the bot. 
    
    "botCommandRole" : "ThisIsTheBotCommanderRoleInDiscord", # Bot commanders will be able to add and remove from the whitelist. This is the role that you assigned to people who have that permission.
    
    "minTimeWhitelisted" : 10, # The is the minimum amount a post has to be created for to get voted, for whitelisted users.
    
    "maxTimeWhitelisted" : 4320, # This is the maximum amount of time a post can be up for to get voted, for whitelisted users.
    
    "minTimeNotWhitelisted" : 30, # The is the minimum amount a post has to be created for to get voted, for non-whitelisted users.
    
    "maxTimeNotWhitelisted" : 4320, # This is the maximum amount of time a post can be up for to get voted, for non-whitelisted users.
    
    "minimumPowerToVote" : 80, # If the account is under this % of VP, it won't vote.
    
   "drottoEnabled" : true,  # Choose to send bits to the @drotto bot
   
    "drottoAmount" : 0.001,  # How much to Send to @drotto if enabled
    
    "voteWhiteListed" : 100, # % to vote whitelisted users
    
    "voteNonWhiteListed" : 25, # % to vote nonwhitelisted users
    
    "privateActiveKey" : "5THEPRIVATEACTIVEKEY", # The private key to the account. Required if drottoEnabled is set to true to send bids
    
    "allowComments" : true, # Choose to allow bot to vote on comments or only root posts
    
    "extraMessage" : " Want to send an extra message with $upvote messages? Type it out here. Start with an whitespace though.", # Send an extra message with (prefix)upvote commands messages.
    
    "_comment1" : "DO NOT CHANGE ANYTHING BELOW THIS!!!", #Comment from me
    
    "version" : "1.0.0" # The bot version you are using. Useful for debugging if you contact someone.
}
```


