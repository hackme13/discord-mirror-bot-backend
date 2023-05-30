import Discord from 'discord.js-selfbot'
// Create a new instance of the Discord bot client
let bot = new Discord.Client();

//importing models
import Token from "../models/Token.js";
import Channels from '../models/Channels.js';
import Keyword from '../models/Keyword.js';
import Ping from '../models/Ping.js';

// Function to destroy the bot and return a promise that resolves when the destruction is complete
function destroyBot() {
    return new Promise(async (resolve, reject) => {
      try {
        await bot.destroy();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
}

// Function to fetch data from the models using the userId
const fetchData = (userId) => {
    return Promise.all([
      Token.findOne({ userId }),
      Channels.find({ userId }),
      Keyword.findOne({ userId }),
      Ping.find({ userId })
    ]);
};

// Create the Discord bot instance with the fetched data
const handleDiscordBot = (userId) => {
    fetchData(userId)
    .then(async (
        [
            getToken,
            getChannels,
            getKeywords,
            getPings
        ]) => {
        // Extract the required information from the fetched data
        const token = getToken.token;

        console.log("token: " + token)

        const channels = {};

        // checking for null channels
        if (!getChannels){
            getChannels = [{
                "senderChannelId": "",
                "receiverChannelWebhook": ""
            }]
        }

        getChannels.forEach((item) => {
            const key = item.senderChannelId;
            const webhook = item.receiverChannelWebhook;
            channels[key] = [webhook];
        });

        // checking for null keywords
        if (!getKeywords){
            getKeywords = {
                replacements: {
                    "": ""
                },
                blacklist: [""],
                blacklistembed: [""]
            }
        } else {
            getKeywords = JSON.parse(JSON.stringify(getKeywords));
        }

        const configReplaceBlacklist = {
            replacements: getKeywords.replacements,
            blacklist: getKeywords.blacklist,
            blacklistembed: getKeywords.blacklistembed
        }

        // removing replacemnets with key-value pair '0':''
        if (Object.keys(configReplaceBlacklist.replacements).length === 1 && 
            configReplaceBlacklist.replacements.hasOwnProperty("0"))
        {
            delete configReplaceBlacklist.replacements['0'];
            configReplaceBlacklist.replacements["randomWordForInitialReplacement"] = ""
        }

        const allowMentions = true;

        let ping = {};

        if (!getPings.length){
            ping["channelID"] = "@mention"
        }

        getPings.forEach((item) => {
            const channelId = item.channelId;
            const role = item.role;
            ping[channelId] = role;
        });
        
        const config = {
            token,
            allowMentions,
            ping,
            channels
        };

        var lastContent = {};

        // Login to Discord with the provided token
        bot.login(token)
        .then(() => {
            console.log('Bot is logged in');
            
            // Event that runs once the client is ready
            bot.once('ready', () => {
                // Access the cache property after the client is ready
                const guildsCache = bot.guilds.cache;
                console.log(`Cached guilds count: ${guildsCache.size}`);
            });

            // Event: Bot is ready
            bot.on('message', (message => {
                let webhooks = config.channels[message.channel.id];

                if(webhooks && webhooks.length > 0){
                    const blacklistItems = configReplaceBlacklist.blacklist;
                    const isValid = blacklistItems.some(str => str !== "");

                    if (isValid && blacklistItems.some(w => message.content.toLowerCase().includes(w))) return 

                    let content = message.content

                    if(!config.allowMentions){
                        if(/<@!?(\d{17,19})>/g.test(message.content)) content = content.replace(/<@!?(\d{17,19})>/g, "")
                        if(/<@&(\d{17,19})>/g.test(message.content)) content = content.replace(/<@&(\d{17,19})>/g, "")
                    }
            
                    let regExp = generateRegEx();                    
                    content = replace(content, regExp)
            
                    for(let webhookURL of webhooks){
                        let [ID, token] = webhookURL.split('/').slice(-2)
                        const hook = new Discord.WebhookClient(ID, token)
                        
                        let mention = config.ping[message.channel.id]
                //		if(content == "") return //don't copy empty  (If enabled embeds or image only will not follow)
                        if(content == ".") return //don't copy messages with only dot
                        if(content == "\\") return //don't copy messages with only backslash
                        if(content == "-") return //don't copy messages with only "-"
                        if(content == " .") return //don't copy messages with only "."
                        if(content == " -") return //don't copy messages with only "-"
                        if(content == lastContent.last) return //If content identical to last message return
                        lastContent.last = content //Store this message into lastContent
                
                        if (content || content.length > 0){
                            hook.send({
                                //content:  content + `\nTextToAdd`,	// This will add an extra text at the end of the post
                                // content:  `${content}\n${mention}`,  // With @mention of group to ping at the end of the post
                                content: content,
                                files: message.attachments.array(),
                                //username: 'WEBHOOK-BOT-USERNAME', // Bot Name Seen By The Users for the Webhook
                                //avatarURL: 'BOT-AVATAR.png', // Bot Avatar HTTP URL
                            }).
                            catch(err => 
                                hook.send(
                                    embed(`Content error: Message could not be sent. Is the webhook correct?\n[Link to the message](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`)
                                )
                            );
                        }
            
                        if(message.embeds.length){
                            for(let e of message.embeds){
                                // if(checkEmbedForKeywordsAnd('ignore', e, null, configReplaceBlacklist.blacklist)) continue
                    
                                e = checkEmbedForKeywordsAnd('replace', e, regExp)
                                hook.send({
                                    embeds: [e]
                                })
                                .catch(err => 
                                    hook.send(embed(`Message could not be sent. Is the webhook correct?\n[Link to the message](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`))
                                )
                            }
                        }
                    }

                    if(!content) lastContent.last = " " //If only attachment, does not count as duplicate
                }
            }))
            
            bot.on('ready', () => {
                let channels = Object.keys(config.channels).flat()
                console.log("Channels: " + channels)
                for(let id of channels){
                    if(!bot.channels.cache.has(id))
                        console.log('Unavailable', id)
                }
                console.log('Selfbot Online')
            })
        })
        .catch((error) => {
            console.error('Failed to log in:', error);
        });
    
        function embed(desc){
            return new Discord.MessageEmbed()
                .setDescription(desc)
                .setColor('RED')
        }
        
        function checkEmbedForKeywordsAnd(action, embed, regExp, keywords = Object.keys(configReplaceBlacklist.replacements)){
            for(let key in embed){
                if(key == 'fields'){
                    for(let f of embed[key]){
                        let match = keywords.find(kw => f.name.toLowerCase()?.includes(kw))
                        if(match){
                            if(action == 'ignore') return match
                            if(action == 'replace'){
                                f.name = replace(f.name, regExp)
                            }
                        }
        
                        match = keywords.find(kw => f.value.toLowerCase()?.includes(kw))
                        if(match){
                            if(action == 'ignore') return match
                            if(action == 'replace'){
                                f.value = replace(f.value, regExp)
                            }
                        }
                    }
                } else if(typeof embed[key] == 'object'){
                    for(let p in embed[key]){
                        let match = keywords.find(kw => embed[key][p]?.toString()?.toLowerCase()?.includes(kw))
                        if(match){
                            if(action == 'ignore') return match
                            if(action == 'replace'){
                                embed[key][p] = replace(embed[key][p], regExp)
                            }
                        }
                    }
                } else{
                    let match = keywords.find(kw => embed[key]?.toString()?.toLowerCase()?.includes(kw))
                    if(match){
                        if(action == 'ignore') return match
                        if(action == 'replace'){
                            embed[key] = replace(embed[key], regExp)
                        }
                    }
                }
            }
            if(action == 'replace') return embed
            if(action == 'ignore') return false
        }
        
        function escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
        }
        
        function generateRegEx(){
            return new RegExp('(' + Object.keys(configReplaceBlacklist.replacements).map(kw => escapeRegExp(kw)).join(')|(') + ')', 'ig')
        }
          
        function replace(str, regExp){
            while(regExp.test(str)){
                let match = str.match(regExp)
                str = str.replace(new RegExp(escapeRegExp(match[0])), configReplaceBlacklist.replacements[match[0].toLowerCase()])
            }
            return str
        }
    })
    .catch((error) => {
        console.error('Failed to fetch data from models:', error);
    });
} 

// Function to initialize the Discord bot with the provided user ID
export async function initializeBot(req, res) {
    try {
        let { userId } = req.userData;
        console.log(userId)

        // Destroy the previous bot instance
        await destroyBot();

        console.log("")
        console.log("========== Bot Destroyed ============")
        console.log("")

        // Create a new instance of the Discord bot client
        bot = new Discord.Client();

        handleDiscordBot(userId);
        res.status(200).json({ success: true, message: "Bot initialized successfully"})
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
};
  