const express = require("express");
const app = express();
const http = require("http").createServer(app);
const path = require("path");
//pool for db connections
const pool = require("./DB/db.cjs")

//for deployement on railway(back) and vercel(front)
const cors = require("cors");
app.use(cors());
const { Server } = require("socket.io");

const io = new Server(http, {
    cors: {
        origin: "*", // TEMP: allow all (debug)
        methods: ["GET", "POST"]
    }
});

//auth and db
const authRoutes = require("./routes/auth.cjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()

app.use(express.json())
app.use("/auth", authRoutes)

//import my files
const User = require("./classes/user-class.cjs");
const table = require("./classes/table-class.cjs");
const Deck = require("./classes/deck-class.cjs");
const Lobby = require("./classes/class-lobby.cjs");
const Engine = require("./engine/engine.cjs");


// Serve the ui folder
app.use(express.static(path.join(__dirname, "../UI")));
app.use(express.static("public"));

//create lobby when server starts
const lobby=new Lobby()

//timer functions
function starttimer(player, table ,engine) {
    player.timer = setTimeout(() => {
        console.log("timer fired for: " + player.name)
        processaction(player, table, engine, {type: "fold"})
    }, 30000);
}

function stoptimer(player) {
    clearTimeout(player.timer);
    player.timer = null;
}
//-----------end of timer functions--------------//

//-----------timer helpers----------------------//
function startgamehelper(table, engine){
    engine.startgame()
    if(table.state==="preflop"){
        for( const p of table.players){
            io.to(p.socketid).emit("user-cards", p.usercards)
        }
        io.to(table.id).emit("updated-table", table.toJSON())
        let currentplayer=table.players[table.currentTurn]
        console.log(currentplayer.name+"'s turn")
        const allowed=table.allowedactions(currentplayer)
        console.log(allowed)

        //-----------emit your turn manually first time--------//
        io.to(currentplayer.socketid).emit("your-turn",
            {   
                message: "your turn",
                allowedactions:allowed
            }
        )
        //start action timer
        starttimer(currentplayer, table, engine)

    }
}

function processaction(player, table, engine, action){
    
    stoptimer(player)//stop timer for previous player.after validation.
    let result=engine.handleaction(player,action)
    console.log(player.name+" "+result)

    io.to(player.socketid).emit("action-processed", result) 

    io.to(table.id).emit("updated-table", table.toJSON())
    // save balances to db after each action
    for(const p of table.players){
        pool.query(
            "UPDATE users SET balance = $1 WHERE id = $2",
            [p.balance, p.id]
        )
    }

    //emit cards when new game starts after very first one is over//
    if(table.state === "preflop") {
        for(const p of table.players) {
            io.to(p.socketid).emit("user-cards", p.usercards)
        }
    }

    const currentplayer=table.players[table.currentTurn]
    console.log(currentplayer.name+"'s turn")
    const allowed=table.allowedactions(currentplayer)
    console.log(allowed)
    if(table.state !== "waiting" && table.currentTurn !== null){
        io.to(currentplayer.socketid).emit("your-turn",{
            allowedactions: allowed,
            message:"your turn"
        });
        starttimer(currentplayer,table, engine)
    }
}

//-------------auth--------------//
io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error("No token"))
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        socket.userdata = decoded
        next()
    } catch (err) {
        next(new Error("Invalid token"))
    }
})

//store created user objects so we dont have to create new object everytime existing user connects.
const users=[]


//socket connection
io.on("connection", (socket)=>{
    console.log("user connected!!!")

    //-----------------------------------------user object created---------------------------//
    socket.on("add-user", () => {
        const incomingId=socket.userdata.id//get id of user connecting on this particular socket

        const existing = connectedUsers.find(p => p.id === incomingId)//check if object withsame id exists in already cretaed objects' array

        if(existing){        existing.socketid = socket.id
            existing.status = "connected"
            socket.myplayer = existing
            // if they were at a table, relink
            if (existing.tableid) {
                const mytable = lobby.tables.find(t => t.id === existing.tableid)
                if (mytable) {
                    socket.mytable = mytable
                    socket.myengine = mytable.engine
                    socket.join(mytable.id)
                    socket.emit("updated-table", mytable.toJSON())
                }
            }
            socket.emit("user-added", existing)
        } else {
            // new player
            const newplayer = new User(socket.userdata.username, socket.id)
            newplayer.id = socket.userdata.id
            newplayer.status = "connected"
            socket.myplayer = newplayer
            connectedUsers.push(newplayer)
            socket.emit("user-added", newplayer)
        }

    })

    
    //enter lobby first, find table and get added. lobby is created when server starts.
    //----------------------SEAT USER and if enough players start game, emit your turn once and res folows----------------------------//
    socket.on("seat-user", (datarecived )=>{
        console.log(datarecived)
        const result=lobby.seatuser(socket.myplayer)

        if(typeof result ==="string"){
            socket.emit("already-seated", result);
            return;
        }
        socket.mytable=result
        socket.myplayer.tableid=result.id
        socket.myengine=socket.mytable.engine

        socket.join(socket.mytable.id)

        io.to(socket.mytable.id).emit("user-seated", socket.mytable.toJSON())

        if(socket.mytable.waitingplayers.length === 2) {
            socket.mytable.lobbyTimer = setTimeout(() => {
                startgamehelper(socket.mytable, socket.myengine)
            }, 30000)
        }

        if(socket.mytable.waitingplayers.length === 6) {
            clearTimeout(socket.mytable.lobbyTimer)
            startgamehelper(socket.mytable, socket.myengine)
        }
    
    });

    //----------------------------------------------handling user actions and gameflow-------------------------------------//
    //once one user is prompted to act, when they act or not,once response is recied, next player is automatically prompted//
    socket.on("useraction", (useraction)=>{
        if(socket.mytable.state !== "waiting" && socket.mytable.currentTurn !== null){
            if(socket.myplayer!==socket.mytable.players[socket.mytable.currentTurn]){
                console.log("not allowd")
                return;
            }

            processaction(socket.myplayer, socket.mytable, socket.myengine, useraction)

        }
    });

    //lisent for disconect which is automatically fired by socket.io when tab, browser or pc is closed.
    socket.on("disconnect", ()=>{
        if(!socket.myplayer)return;
        if (!socket.mytable || !socket.myengine) return

        //mark player disconected, and use it when reseting table for new hand to kick out disconected players, as well as 0 balanced ones
        socket.myplayer.status="disconnected"

        //fold them untill hand is over, so we dont mess up the flow and user has chance to ontinou playing if the come before hand is over
        if(socket.mytable.players[socket.mytable.currentTurn]===socket.myplayer){
            //if its their turn, fold them by processaction and passing in fold actiontype, so that advancetunr is called and flow doesnt brake
            processaction(socket.myplayer, socket.mytable, socket.myengine,{type: "fold"})
        }else{
            //if not, just mark them folded.
            socket.myplayer.folded=true
        }

    })


    

//socket end
});

//-------------------------------------------------start the server-----------------------------------------------//
//for deployement
const PORT = process.env.PORT || 3000
http.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});


//once i prompt one user, their response will make the next user get the prompt,
//and thatsa how i go to each player on the table?
//like you only do explicit prompt one time, 
//like domino, you push first one, and when it falls it makes other fall.
//server will recive actions from players and then find the player's table and do actions on it, 
//we first find table and then call functions on it
//server just reacts to user actions, it doesnt constantly run code
//server is just there to listen and based on what it recives does imloemented code in the scope of the recived allowed action
