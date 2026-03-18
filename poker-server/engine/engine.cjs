
const Table = require("../classes/table-class.cjs");
const User = require("../classes/user-class.cjs");
const Deck = require("../classes/deck-class.cjs");
const Evaluation=require("./handevaluation.cjs")

class Engine{

    constructor(table){
        this.table = table;
        this.evaluator=new Evaluation()
    }

    startgame(){
        if((this.table.players.length+this.table.waitingplayers.length)>=2 && this.table.state==="waiting"){
            console.log("starting game")
            this.table.players.push(...this.table.waitingplayers)
            this.table.waitingplayers=[]
            console.log(this.table.players)
            if(this.table.gamesplayed>0){
                console.log("new game started")
                this.table.resetfornewgame()//move dealer, clear pot, higestbet, player and comunity cards
            }else{
                console.log("gamestarted")
                this.table.setdealer()//set dealer on first game
            }
            this.table.deck=new Deck()
            this.table.deck.shuffle()
            
            this.table.state="preflop"
            this.dealcards()
            for( let p of this.table.players){
                console.log(p.usercards)
            }
           
            const bb=this.table.players[this.table.bigBlindIndex]
            const sb=this.table.players[this.table.smallBlindIndex]

            if(bb.balance>this.table.bigBlind){
                bb.balance-=this.table.bigBlind
                this.table.pot+=this.table.bigBlind
                bb.contribution+=this.table.bigBlind
                this.table.highestbet=bb.contribution
            }else{
                bb.isAllin=true
                bb.hasActed=true
                this.table.pot+=bb.balance
                bb.contribution+=bb.balance
                bb.balance=0
                this.table.highestbet=bb.contribution
            }
            
            if(sb.balance>this.table.smallBlind){
                sb.balance-=this.table.smallBlind
                this.table.pot+=this.table.smallBlind
                sb.contribution+=this.table.smallBlind
            }else{
                sb.isAllin=true
                sb.hasActed=true
                sb.contribution+=sb.balance
                this.table.pot+=sb.balance
                sb.balance=0
            }

          
        }
    }

    

    dealcards(){

        for (let i = 0; i < 2; i++){
            for(let player of this.table.players){
                let myusercards=player.usercards
                myusercards.push(this.table.deck.pop())//here pop() is deck class function, not built in
            }
        }
    }

    //betting, call,raise,fold,all-in,check

    docall(player){
        if(this.table.highestbet===0 || player.contribution===this.table.highestbet){
            return "call not allowed"
        }

        if(player.balance<this.table.highestbet-player.contribution){
            return "insificient, call not allowed, only all in "
        }else{
            const tocall=this.table.highestbet-player.contribution
            if(player.balance === tocall){
                player.isAllin = true
            }
            player.balance-=tocall
            this.table.pot+=tocall
            player.hasActed=true
            player.contribution+=tocall
            this.advanceturn()
            return "called"
        }
    }

    doallin(player){
        if(player.balance===0){
            return "can not call"
        }else{
            this.table.pot+=player.balance
            player.contribution+=player.balance
            player.balance=0
            player.hasActed=true
            player.isAllin=true
            if(player.contribution>this.table.highestbet){
                this.table.highestbet=player.contribution
                for(let p of this.table.players){
                    if(p!==player && !p.folded && !p.isAllin){
                        p.hasActed=false
                    }
                }  //reset if all in caused raise
            }
            this.advanceturn()
            return "all-in"
        }
    }

    //raise only can happen if you bet more that whats bneccessary to match the highest bet(highestbet-playercontribution)
    //and  minimum raise amount is 20 chips in my game, you  cant raise with less than that. 
    //after someone has raised, round has to continou untill everyone mathces higest bet, or folds, or is allin. 
    //after raise, for this we reset everyones hasacted atribute to false, besides raiser.
    //by rules by raising you bet callamout+raiseamount, not just raise amount

    doraise(player,raiseamount){
        const tocall=this.table.highestbet-player.contribution
        const total=tocall+raiseamount
        if(player.balance<total){
            return "insuficient"
        }
        if(raiseamount<this.table.minbet ){
            return "higher bet needed"
        }else{
            let isbet=false
            if(this.table.highestbet===0 && player.contribution===0){
                isbet=true
            }
            if(player.balance === total){
                player.isAllin = true
            }
            player.balance-=total
            player.contribution+=total
            this.table.pot+=total
            player.hasActed=true
            for(let p of this.table.players){
                if(p!==player && !p.folded && !p.isAllin){
                    p.hasActed=false
                }
            }
            this.table.highestbet=player.contribution
            this.table.minraise=raiseamount
            
            this.advanceturn()
            
            if(isbet){return "betted"}
            return "raised"
        }
    }

    dofold(player){
            player.folded=true
            player.hasActed=true
            this.advanceturn()
            return "folded"
    }
    
    docheck(player){
        if(player.contribution===this.table.highestbet){
            player.hasActed=true
            this.advanceturn()
            return "checked"
        }else{
            return "cant check"
        }
    }


    advanceturn(){
        //check if everyone has acted and if so advance state
        const activePlayers = this.table.players.filter(p => !p.folded && !p.isAllin);
        const everyoneActed = activePlayers.every(p => p.hasActed);

        if(activePlayers.length === 0 || everyoneActed){
            // no one left to act → advance stage
            this.checkandadvance();
            console.log("noone left, should advance state")
            return;
        }


        //find who can act
        let n = this.table.players.length;
        let found = false;
        
        for(let i=0; i<n; i++){
            this.table.currentTurn = (this.table.currentTurn + 1) % n;
            const p=this.table.players[this.table.currentTurn]
            if(!p.hasActed && !p.isAllin && !p.folded){
                found = true;
                break;
            }
        }
        
        if(!found){//if no player is found, safety
            this.checkandadvance();
            return;
        }
        console.log("turn advanced to "+this.table.players[this.table.currentTurn].name)
    }


    //actions allowed for each state, will be called in the connection
    handleaction(player, action){

        if(player!==this.table.players[this.table.currentTurn]){
            return "not your turn, action not allowed"
        }

        if(this.table.state==="waiting"){
            return "still waiting"
        }
        const allowedActions = this.table.allowedactions(player)

        if(!allowedActions.includes(action.type)){
            return {error:"Action not allowed"}
        }
        player.lastaction=action.type

        let result
        switch(action.type){
            case "call": result = this.docall(player); break;
            case "raise": result = this.doraise(player, action.amount); break;
            case "all-in": result = this.doallin(player); break;
            case "fold": result = this.dofold(player); break;                
            case "bet": result = this.doraise(player, action.amount); break;
            case "check": result = this.docheck(player); break;
            //net can use same logic as raise,
            //  bet is only used t the staer of new stage, 
            // thus highest bet in table is 0,
            //  allowing raise function to do logic for bet
        }

       
        return result;

    }
    
    resetHasActed(){//reset when state is changed
        this.table.minraise=20
        for(let p of this.table.players){
            if(!p.folded && !p.isAllin){
                p.hasActed=false
                p.contribution=0
                p.lastaction="not acted"
            }
        }
    }

    advanceStage(){
        let index=this.table.states.indexOf(this.table.state)
        index=(index+1)%this.table.states.length
        this.table.state=this.table.states[index]
        this.table.resetturnfornewstage()//chnages currentTurn to dealerindex+1
        this.resetHasActed()//resets player.hasacted to false
        this.table.highestbet=0
        switch (this.table.state){
            case "waiting":
                console.log("state is "+this.table.state)
                this.startgame()
                break
            case "flop":
                console.log("state is "+this.table.state)
                console.log("dealing flop")
                this.dealflop()
                break
            case "river":
                console.log("state is "+this.table.state)
                console.log("dealing river")
                this.dealriver()
                break
            case "turn":
                this.dealturn()
                break
            case "showdown":
                console.log("state is "+this.table.state)
                this.handevaluation()//evaluate hands first
                this.giverevards()//then give rewards based on evaluation
                this.table.gamesplayed++
                this.settowaiting()//after giving rewards switch state to waiting
                this.startgame()
                break     
        }
        const canAct = this.table.players.filter(p => !p.folded && !p.isAllin);//for checking if there are players who can act
        if(canAct.length === 0 && this.table.state !== "waiting" && this.table.state !== "showdown"){
            this.checkandadvance()
        }

    }

    checkandadvance() {
        const activePlayers = this.table.players.filter(p => !p.folded)
        if(activePlayers.length === 1) {
            activePlayers[0].balance += this.table.pot
            this.table.pot = 0
            this.table.state = "showdown" // skip remaining streets
            this.table.gamesplayed++
            this.settowaiting()
            this.startgame()
            return
        }

        for (let p of this.table.players) {
            if (p.folded || p.isAllin) continue;
            if (!p.hasActed) return; // someone still needs to act
            if (p.contribution !== this.table.highestbet) return; // bets not matched
        }
        console.log("advancing state");
        this.advanceStage();
    }

    //dealing comunity(table) cards, flop, river, trun.
    dealflop(){
        this.table.deck.pop()//burn one
        this.table.tablecards.push(this.table.deck.pop())
        this.table.tablecards.push(this.table.deck.pop())
        this.table.tablecards.push(this.table.deck.pop())
        console.log("flop: ")
        console.log(this.table.tablecards)
    }

    dealriver(){
        this.table.deck.pop()//burn one
        this.table.tablecards.push(this.table.deck.pop())
        console.log("river: ")
        console.log(this.table.tablecards)
    }

    
    dealturn(){
        this.table.deck.pop()//burn one
        this.table.tablecards.push(this.table.deck.pop())
        console.log("turn: ")
        console.log(this.table.tablecards)
    }
   
    handevaluation(){
        const activePlayers = this.table.players.filter(p => !p.folded)
        console.log("evaluating")
        let result=[]

        for(const p of activePlayers){
            let cards=[...p.usercards, ...this.table.tablecards]
            p.besthand=this.evaluator.playerbest(cards)
            console.log(p.name+" has :")
            console.log(p.besthand)
        }

        let best = activePlayers.reduce((best, p) =>
            this.evaluator.comparehands(p.besthand, best.besthand) > 0 ? p : best
        )
        this.table.lastwinners = activePlayers.filter(p =>
            this.evaluator.comparehands(p.besthand, best.besthand) === 0
        )
    }


  giverevards(){
    console.log("giving rewards")
    const winners = this.table.lastwinners
    const share = Math.floor(this.table.pot / winners.length)
    
    for(let w of winners){
        w.balance +=share
        console.log(w.name+" gets "+share)
    }
    this.table.pot = 0

    }

    settowaiting(){
        this.table.state="waiting"
    }

//end
}

module.exports = Engine;
