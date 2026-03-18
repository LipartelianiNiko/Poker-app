const Deck=require("./deck-class.cjs");
const User = require("./user-class.cjs");


let tableidincrement=1

class table{
    constructor(){
        this.id=tableidincrement++;
        this.players=[];//players seating at the table, max 6
        this.waitingplayers=[]//players joining after game started
        this.pot=0;//pot size
        this.highestbet=0;
        this.deck=null;
        this.tablecards=[];//flop, turn, river.
        this.minraise=20;
        this.minbet=20;
        this.lastwinners=[]
        //managing flow and turns
        this.dealerIndex=null;
        this.bigBlindIndex=null;
        this.smallBlindIndex=null;

        this.state="waiting";
        this.states = ["waiting", "preflop", "flop", "turn", "river", "showdown"];
        this.currentTurn=null


        this.smallBlind=10;
        this.bigBlind=20;
        
        this.engine=null;

        this.gamesplayed=0
        this.lobbyTimer=null


    }

    toJSON() {
        return {
            id: this.id,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                balance: p.balance,
                folded: p.folded,
                isAllIn: p.isAllin,
                contribution: p.contribution, 
                hasacted: p.hasActed,
                lastaction: p.lastaction
            })),
            waitingplayers: this.waitingplayers.map(p => ({
                id: p.id,
                name: p.name,
                balance: p.balance,
                folded: p.folded,
                isAllIn: p.isAllin,
                contribution: p.contribution
            })),
            pot: this.pot,
            tableCards: this.tablecards,
            currentTurn: this.currentTurn,
            state: this.state,
            smallBlind: this.smallBlindIndex,
            bigBlind: this.bigBlindIndex,
            dealer: this.dealerIndex,
            highestbet: this.highestbet
        }
    }


    advancedealer(){
        this.dealerIndex=(this.dealerIndex+1)%this.players.length
        this.bigBlindIndex=(this.dealerIndex+2)%this.players.length
        this.smallBlindIndex=(this.dealerIndex+1)%this.players.length
        this.currentTurn=(this.bigBlindIndex+1)%this.players.length
    }

    setdealer(){
        if(this.players.length>0){
            this.dealerIndex=0%this.players.length;
            this.bigBlindIndex=(this.dealerIndex+2)%this.players.length;
            this.smallBlindIndex=(this.dealerIndex+1)%this.players.length;
            this.currentTurn=(this.bigBlindIndex+1)%this.players.length
        }
    }
    
    resetturnfornewstage(){//reset currentTurn to dealers fisrt left active player
        let i=1
        while(i<=this.players.length){
                this.currentTurn=(this.dealerIndex+i)%this.players.length
                let currentplayer=this.players[this.currentTurn]
                if(currentplayer.folded===false && currentplayer.isAllin===false){
                    return this.currentTurn
                }else{
                    i++
                }
        }
        console.log("all players ar eincative, must kick them out")
        return null

    }

    resetfornewgame(){//move dealer itself, thus moving bb and sb
        this.advancedealer()
        this.pot=0
        this.highestbet=0
        this.tablecards=[]
        for(let p of this.players){
            p.hasActed=false
            p.isAllin=false
            p.folded=false
            p.usercards=[]
            p.contribution=0
        }
    }

    allowedactions(player){
        if(player!==this.players[this.currentTurn]){
            return "not your turn"
        }
        let allowed=["fold"]
        const tocall=this.highestbet-player.contribution
        if(player.balance>0){
            allowed.push("all-in")
            if(player.balance>=tocall && tocall>0){
                allowed.push("call")
            }
            if(this.highestbet===0){
                allowed.push("bet")
            }
            if(player.balance>=(tocall+this.minbet) && this.highestbet>0){
                allowed.push("raise")
            }
        }
        if(player.contribution===this.highestbet){
            allowed.push("check")
        }

        return allowed
    }

//end
}

module.exports=table;
