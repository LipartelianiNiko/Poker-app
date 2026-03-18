let nextUserId = 1;

class User{
    
    constructor(name,socketid){
        this.id=nextUserId++;//assigned value first to this.id and then incrment nextUserId
        this.name=name;
        this.balance=1000;

        this.tableid=null;


        this.usercards=[];//cards that user is holding
        this.besthand=[]

        this.folded=false;//check if user has folded, to manage flow

        this.isAllin=false;//to track if player is all in and do not ask them to bet more
        this.hasActed=false;//to know if we have to start new cycle of actions
        this.contribution=0;//how muchhas player betted in current round of betting

        this.socketid=socketid
        this.status="disconnected"
        this.timer=null
        this.lastaction="not acted"
        }

}

module.exports = User;


