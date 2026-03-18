const table = require("./table-class.cjs");
const Engine = require("../engine/engine.cjs");



class Lobby{
    constructor(){
    this.tables=new Map();//existing tables
    }


    //add player to table
    seatuser(myplayer){
        const playerTable = this.findTableWithSpace(); 
        playerTable.waitingplayers.push(myplayer)             
        return playerTable;      
    };



    //find active tables with empty seat
    findTableWithSpace(){
        for(const table of this.tables.values()){
            if(table.players.length<6 && table.waitingplayers.length+table.players.length<6){
                return table;
            }
        }
        return this.createTable();
    };

    //create table if no active tables have empty seat 
    createTable(){
        const newtable=new table()
        this.tables.set(newtable.id, newtable)
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
