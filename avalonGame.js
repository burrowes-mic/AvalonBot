const NOMINATION_MATRIX = [[2,3,2,3,3],[2,3,4,3,4],[2,3,3,4,4],[3,4,4,5,5],[3,4,4,5,5],[3,4,4,5,5]];
const NOMINATION_PHASE = 0;
const VOTING_PHASE = 1;
const MISSION_PHASE = 2;

class PlayerData {
    constructor(good, dmer) {
        this.good = good;
        this.voted = false;
        this.missioned = false;
        this.dmer = dmer;
    }

    dm(msg, tts=false) {
        this.dmer(msg, tts);
    }
}

class Game {
    constructor() {
        this.running = false;
    }

    beginGame(players, messenger, channeler)
    {
        if(this.running) {
            messenger('Unable to create a new Avalon game while one is already running!');
            return false;
        }

        if(players.length < 5 || players.length > 10) {
            messenger('Unable to create a new Avalon game with fewer than 5 or more than 10 players!');
        }
        
        this.players = players;
        this.playerData = new Map();
        this.players.forEach(player => {
            this.playerData.set(player, new PlayerData(true, channeler(player)));
        });
        this.playerCount = this.players.length;
        this.leaderIndex = Math.floor(Math.random() * this.playerCount);
        this.phase = NOMINATION_PHASE;
        this.stage = 0;
        this.numToNominate = this.numToNominate = NOMINATION_MATRIX[this.playerCount][this.stage];
        this.nominees = [];
        this.accepts = 0;
        this.rejects = 0;
        this.failedVotes = 0;
        this.succeeds = 0;
        this.fails = 0;
        this.running = true;
        this.messenger = messenger;

        this.messenger('Starting new Avalon game!');
        this.beginNomination();
        return true;
    }

    beginNomination()
    {
        this.phase = NOMINATION_PHASE;
        ++this.leaderIndex;
        if(this.leaderIndex == this.playerCount) {
            this.leaderIndex = 0;
        }
        this.nominees = [];
        this.numToNominate = this.numToNominate = NOMINATION_MATRIX[this.playerCount][this.stage];

        this.messenger(`Beginning stage ${this.stage}`);
        if(this.stage == 3) {
            this.messenger(`Remember, evil must submit TWO failures this mission for it to fail!`);
        }
        this.messenger(`The current leader is ${this.players[this.leaderIndex].mention}`);      
        this.messenger(`Please nominate ${this.numToNominate} players for this mission.`);
        this.messenger(`This vote has been failed ${this.failedVotes} time(s)`);
    }

    nominate(nominator, nominees)
    {
        if(this.phase != NOMINATION_PHASE) {
            this.messenger(`It is not yet time to nominate!`);
        }

        if(nominator != this.players[this.leaderIndex]) {
            this.messenger(`Only ${this.players[this.leaderIndex].mention} is allowed to nominate right now!`);
            return false;
        }

        if(nominees.length != this.numToNominate) {
            this.messenger(`You must nominate exactly ${this.numToNominate} players this stage!`);
            return false;
        }

        var flag = false;
        nominees.forEach(nominee => {
            if(!this.players.includes(nominee)) {
                this.messenger(`${nominee.mention} is not in the game and cannot be nominated!`);
                flag = true;
            }
        });
        if(flag)
            return false;

        this.nominees = nominees;
        this.beginVoting();
    }

    beginVoting()
    {
        this.phase = VOTING_PHASE;
        this.accepts = 0;
        this.rejects = 0;
        this.failedVotes = 0;
        this.playerData.forEach(data => {
            data.voted = false;
        });
        this.messenger(`The nominees have been chosen. Please vote with either \"avalon!accept\" or \"avalon!reject\".`);
        if(this.stage == 3) {
            this.messenger(`Remember, evil must submit TWO failures this mission for it to fail!`);
        }
    }

    vote(voter, accepted)
    { 
        if(this.phase != VOTING_PHASE) {
            this.messenger(`It is not yet time to vote!`);
        }

        var data = this.playerData.get(voter);
        if(data.voted) {
            this.messenger(`You have already voted!`);
        }

        data.voted = true;
        if(accepted) {
            this.accepts++;
        } else {
            this.rejects++;
        }

        //if(this.accepts + this.rejects == this.playerCount) {
            this.messenger(`All votes are in!`);
            if(this.accepts > this.rejects) {
                this.messenger(`The mission has been accepted, with ${this.accepts} votes for and ${this.rejects} against!`);
                this.beginMission();
            } else {
                this.messenger(`The mission has been rejected, with ${this.accepts} votes for and ${this.rejects} against!`);
                this.failedVotes++;
                if(this.failedVotes == 5) {

                } else {
                    this.beginNomination();
                }
            }
        //}
    }

    beginMission()
    {
        this.phase = MISSION_PHASE;
        this.succeeds = 0;
        this.fails = 0;
        this.playerData.forEach(data => {
            data.missioned = false;
        });

        this.messenger(`The mission-goers are now making their choices.`);
        if(this.stage == 3) {
            this.messenger(`Remember, evil must submit TWO failures this mission for it to fail!`);
        }
    
        this.nominees.forEach(nominee => {
            this.playerData.get(nominee).dm(`Please message \"avalon!succeed\" or \"avalon!fail\".`);
        });
    }

    mission(missioner, succeeded)
    {
        var data = this.playerData.get(missioner);

        if(this.phase != MISSION_PHASE) {
            data.dm(`It is not yet time to succeed or fail!`);
        }
        
        if(data.missioned) {
            data.dm(`You have already completed the mission!`);
        }

        data.missioned = true;
        if(succeeded) {
            this.succeeds++;
        } else {
            this.fails++;
        }

        data.dm(`Your result has been tallied.`);

        if(this.accepts + this.succeeds == this.fails) {
            this.messenger(`All mission results are in!`);
            if(this.fails > 1 || (this.fails > 0 && this.stage != 3)) {
                this.messenger(`The mission has failed with ${this.fails} votes of failure and ${this.succeeds} of success!`);
            } else {
                this.messenger(`The mission has succeeded with all ${this.succeeds} votes!`);
            }

            // win cons
            this.stage++;
            this.beginNomination();
        }
    }
}

module.exports = { 
    instance: new Game()
}