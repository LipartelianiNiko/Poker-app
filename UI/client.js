//declare connection
//no hadcoded url, will automatically connect to whatever server serves.
const mysocket = io("https://poker-app-production-13b6.up.railway.app", {
    auth: { token: localStorage.getItem("token") },
    autoConnect: false
});

mysocket.on("connect",()=>{
    console.log("i am connected to server")

})

//id for finding my object in table JSON and displaying my info 
let myid
let myname
let countdownInterval
let lobbyinterval


//pages
const authpage=document.getElementById("auth-page")
const home=document.getElementById("home-page")
const gamepage=document.getElementById("game-page")

//prevent refresh from reseting page
window.addEventListener("load", () => {
    const token = localStorage.getItem("token")
    if(token){
        mysocket.auth.token = token
        mysocket.connect()
        mysocket.once("connect", () => {
            mysocket.emit("add-user")
        })
        authpage.classList.remove("active")
        home.classList.add("active")
    }
})

//buttons
const leavetbtn=document.getElementById("leave")
const startbtn=document.getElementById("start")
const nameinput=document.getElementById("user-name")

//info
const balance=document.getElementById("balance")
const pot=document.getElementById("pot")
const turn=document.getElementById("current")
const timerDisplay=document.getElementById("timer")
const tabletimer=document.getElementById("tabletimer")

//--------auth-------------------//
const loginbtn = document.getElementById("login-btn")
const registerbtn = document.getElementById("register-btn")
const passwordinput = document.getElementById("user-password")
const autherror = document.getElementById("auth-error")


async function authenticate(endpoint) {
    const username = nameinput.value
    const password = passwordinput.value
    if (!username || !password) {
        autherror.textContent = "enter username and password"
        return
    }
    try {
        const res = await fetch(`https://poker-app-production-13b6.up.railway.app/auth/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        })
        const data = await res.json()
        if (data.error) {
            autherror.textContent = data.error
            return
        }
        localStorage.setItem("token", data.token)
        mysocket.auth.token = data.token
        mysocket.connect()
        mysocket.once("connect", () => {
            mysocket.emit("add-user")
        })
        myname = username
        authpage.classList.remove("active")
        home.classList.add("active")
    } catch (err) {
        autherror.textContent = "something went wrong"
    }
}

loginbtn.addEventListener("click", () => authenticate("login"))
registerbtn.addEventListener("click", () => authenticate("register"))




//cards
//betting buttons
const allinbtn=document.getElementById("all-in")
const callbtn=document.getElementById("callbtn")
const foldbtn=document.getElementById("foldbtn")
const raisebtn=document.getElementById("raisebtn")
const checkbtn=document.getElementById("checkbtn")
const raiseinp=document.getElementById("raiseamount")
const betbtn=document.getElementById("betbtn")


function disablebuttons(){
    allinbtn.disabled=true
    callbtn.disabled=true
    foldbtn.disabled=true
    raisebtn.disabled=true
    checkbtn.disabled=true
    betbtn.disabled=true
}
disablebuttons()
//-----------------------------page 1 to page 2, log-in page to home page---------------------//


mysocket.on("user-added", (datarecived)=>{
    console.log("welcome "+datarecived.name)
    console.log(datarecived)
    myid=datarecived.id
    myname=datarecived.name
});

mysocket.on("your-turn", (datarecived)=>{
    if(datarecived.allowedactions.includes("all-in")){
        allinbtn.disabled=false
    }
    if(datarecived.allowedactions.includes("call")){
        callbtn.disabled=false
    }
    if(datarecived.allowedactions.includes("fold")){
        foldbtn.disabled=false
    }
    if(datarecived.allowedactions.includes("raise")){
        raisebtn.disabled=false
    }
    if(datarecived.allowedactions.includes("check")){
        checkbtn.disabled=false
    }
    if(datarecived.allowedactions.includes("bet")){
        betbtn.disabled=false
    }
    console.log(datarecived.message)
    console.log("allowed: "+datarecived.allowedactions)
    startCountdown(30);
})

mysocket.on("someoneacted", (datarecived)=>{
    if(datarecived.who.id===myid){
    console.log(datarecived.who+" "+datarecived.what)

    }
})
mysocket.on("action-processed", (datarecived) => {
    console.log(datarecived)
    disablebuttons()
    clearInterval(countdownInterval)

})

//-------------------timer for front end--------------//
function startCountdown(seconds) {
    clearInterval(countdownInterval); // clear any existing one
    let timeLeft = seconds;
    // update your UI element every second
    countdownInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if(timeLeft <= 0) clearInterval(countdownInterval);
    }, 1000);
}
//------------------end of timer------------------------//

mysocket.on("user-cards", (datarecived)=>{
    console.log("mycards")
    console.log(datarecived)
    document.getElementById("card1").textContent=`${datarecived[0].rank}${datarecived[0].suit}`
    document.getElementById("card2").textContent=`${datarecived[1].rank}${datarecived[1].suit}`
})

mysocket.on("updated-table", (datarecived)=>{

    //if player disconected but reconected untill being removed from the table, take them to game page
    if(home.classList.contains("active")) {
        home.classList.remove("active");
        gamepage.classList.add("active");
    }

    console.log("table-update")
    console.log(datarecived)

    if(datarecived.state === "preflop" && datarecived.tableCards.length === 0) {
        document.getElementById("flop1").textContent = ""
        document.getElementById("flop2").textContent = ""
        document.getElementById("flop3").textContent = ""
        document.getElementById("turn1").textContent = ""
        document.getElementById("river1").textContent = ""
    }

    if(datarecived.tableCards.length===3){
    document.getElementById("flop1").textContent=`${datarecived.tableCards[0].rank}${datarecived.tableCards[0].suit}`
    document.getElementById("flop2").textContent=`${datarecived.tableCards[1].rank}${datarecived.tableCards[1].suit}`
    document.getElementById("flop3").textContent=`${datarecived.tableCards[2].rank}${datarecived.tableCards[2].suit}`
    }
    if(datarecived.tableCards.length===4){
    document.getElementById("turn1").textContent=`${datarecived.tableCards[3].rank}${datarecived.tableCards[3].suit}`
    }
    if(datarecived.tableCards.length===5){
    document.getElementById("river1").textContent=`${datarecived.tableCards[4].rank}${datarecived.tableCards[4].suit}`
    }

    const me=datarecived.players.find(player=>player.id===myid)
    const mybalance=me.balance
    document.getElementById("name").textContent=`${myname} | ${mybalance} | ${me.lastaction}`

    const others=datarecived.players.filter(player=>player!==me)
    balance.textContent=me.balance
    pot.textContent=datarecived.pot
    turn.textContent=datarecived.players[datarecived.currentTurn].name
    document.getElementById("bigblind").textContent=datarecived.players[datarecived.bigBlind].name
    document.getElementById("smallblind").textContent=datarecived.players[datarecived.smallBlind].name
    document.getElementById("dealer").textContent=datarecived.players[datarecived.dealer].name
    document.getElementById("highestbet").textContent=datarecived.highestbet
    adduserstoui(datarecived.players)
    
})


//-------------------------page 2 to game page, statrt game---------------------------//
startbtn.addEventListener('click',()=>{
    mysocket.emit("seat-user","client wants to start game");
})
mysocket.on("user-seated", (datarecived)=>{
        home.classList.remove("active");
        gamepage.classList.add("active");
        console.log(datarecived)
        const mybalance=datarecived.waitingplayers.find(player=>player.id===myid).balance
        document.getElementById("name").textContent=`${myname} | ${mybalance}`

        if(datarecived.waitingplayers.length>0){
            adduserstoui(datarecived.waitingplayers)
        }
        if(datarecived.waitingplayers.length===2){
            clearInterval(lobbyinterval); // clear any existing one
            let timeLeft = 30;
            // update your UI element every second
            lobbyinterval = setInterval(() => {
                timeLeft--;
                tabletimer.textContent = timeLeft;
                if(timeLeft <= 0) clearInterval(lobbyinterval);
            }, 1000);        
        }
});

//---------------------------------------betting buttons----------------------------------------------//
allinbtn.addEventListener("click",()=>{
    mysocket.emit("useraction",{
        type: "all-in"
    })
    disablebuttons()
})

callbtn.addEventListener("click", ()=>{
    mysocket.emit("useraction",{
        type: "call"
    })
    disablebuttons()
})

raisebtn.addEventListener("click", ()=>{
    const raiseamount=Number(raiseinp.value)
    console.log(raiseamount)
    if(raiseamount>=20){
        mysocket.emit("useraction", {
            type: "raise",
            amount: raiseamount
        })
    disablebuttons()
    }
})

betbtn.addEventListener("click", ()=>{
    const raiseamount=Number(raiseinp.value)
    console.log(raiseamount)
    if(raiseamount>=20){
        mysocket.emit("useraction", {
            type: "bet",
            amount: raiseamount
        })
    disablebuttons()
    }
})

checkbtn.addEventListener("click", ()=>{
    mysocket.emit("useraction",{
        type: "check"
    })
    disablebuttons()
})

foldbtn.addEventListener("click", ()=>{
    mysocket.emit("useraction",{
        type: "fold"
    })
    disablebuttons()
})

//leave table
leavetbtn.addEventListener("click", () => {
    mysocket.emit("leave");
});
 mysocket.on("left", ()=>{
        home.classList.add("active");
        gamepage.classList.remove("active");
})

//---------------------------end of buttons-------------------------------------------//

function adduserstoui(players){
        const seatOrder = [4,2,1,3,5]
        const n=players.length
        const myplayers=players
        const myindex=myplayers.findIndex(p => p.id === myid)
        let j=0
        for(let i=(myindex+1)%n; i!==myindex; i=(i+1)%n){
            let seat=document.getElementById(`seat-${seatOrder[j]}`)
            seat.textContent = `${myplayers[i].name} | ${myplayers[i].balance} | ${myplayers[i].lastaction}`
            j++
        }
}

mysocket.on("already-seated", (datarecived) => {
    console.log(datarecived)
    console.log("you are already seated");
});


//listener for disconect, so we switch to home page when user is diconected.
mysocket.on("disconnect", ()=>{
    gamepage.classList.remove("active");
    home.classList.add("active");
})

mysocket.on("connect_error", (err) => {
    console.error("Socket error:", err.message);
});

