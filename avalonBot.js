const eris = require('eris');
var game = require('./avalonGame.js').instance;

const PREFIX = 'avalon!';

const bot = new eris.Client('NjkwMzU5NTU5Njc1ODM4NTU1.XnQR3Q.i1q0WiZMumaq005n1r0gpDnEUus');

/***********************************************
 * COMMAND HANDLERS
 ***********************************************/
const commandHandler = {};
commandHandler['run'] = (msg, args) => {
    if(msg.hasOwnProperty('recipient')) {
        return false;
    }

    players = [];
    args.forEach(arg => {
        players.push(bot.users.find(user => user.id == arg.substring(3,arg.length-1)));
    });
    
    game.beginGame(players, (_msg, _tts=false) => {
        return msg.channel.createMessage({content:_msg, tts:_tts});
    }, (player) => {
        return (_msg, _tts) => {
            player.getDMChannel().then(result => {
                result.createMessage({content:_msg, tts:_tts});
            });
        };
    });
    return true;
};

commandHandler['nominate'] = (msg, args) => {
    nominees = [];
    args.forEach(arg => {
        nominees.push(bot.users.find(user => user.id == arg.substring(3,arg.length-1)));
    })

    game.nominate(msg.author, nominees);
    return true;
};

function handleVote(msg, args, accepted) {
    game.vote(msg.author, accepted);
}

commandHandler['accept'] = (msg, args) => {
    handleVote(true);
};

commandHandler['reject'] = (msg, args) => {
    handleVote(false);
};

function handleMission(msg, args, succeeded) {
    if(msg.hasOwnProperty('recipient')) {
        game.mission(msg.author, succeeded);
    }
    else {

    }
}

commandHandler['succeed'] = (msg, args) => {
    handleMission(true);
};

commandHandler['fail'] = (msg, args) => {
    handleMission(false);
};


/***********************************************
 * BOT SETUP
 ***********************************************/

bot.on('ready', () => {
    console.log('Bot connected!');
});

bot.on('messageCreate', async(msg) => {
    const content = msg.content;

    if (!content.startsWith(PREFIX)) {
        return;
    }
  
    const parts = content.split(' ').map(s => s.trim()).filter(s => s);
    const commandName = parts[0].substr(PREFIX.length);
  
    const handler = commandHandler[commandName];
    if (!handler) {
        return;
    }
  
    const args = parts.slice(1);
  
    try {
        await handler(msg, args);
    } catch (error) {
        console.warn('Error handling command!');
        console.warn(error);
    }
});

bot.on('error', error => {
    console.warn(error);
});

bot.connect();