const table = require("./table-class.cjs");
const Engine = require("../engine/engine.cjs");



class Lobby{
    constructor(){
        this.tables=[];//existing tables
    }


    //add player to table
    seatuser(myplayer){
        //check if player is already seated, by checking if the player's id matches any of the seated players' id. if so, dont allow seating.
        for(let mytable of this.tables){
            let totalPlayers=[...mytable.players, ...mytable.waitingplayers]

            for(let player of totalPlayers){

                if(player.id===myplayer.id){
                    return "already seated, cant seat again"
                }
            }
        }
        //if check doesnt find already seated player with matching id, seat the user.
        const playerTable = this.findTableWithSpace(); 
        playerTable.waitingplayers.push(myplayer)             
        return playerTable;      
    };



    //find active tables with empty seat
    findTableWithSpace(){
        for(const table of this.tables){
            if(table.waitingplayers.length+table.players.length<6){
                return table;
            }
        }
        return this.createTable();
    };

    //helper to create table if no active tables have empty seat 
    createTable(){
        const newtable=new table()
        const myengine=new Engine(newtable)
        newtable.engine=myengine
        return newtable
    };
    
    //destroy table if its emty
    destroyTable(){};


    //remove player from table
    removePlayer(){};
}

//export
module.exports = Lobby;
