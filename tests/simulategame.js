const io = require("socket.io-client")

// create two players
const p1 = io("http://localhost:3000")
const p2 = io("http://localhost:3000")
const p3 = io("http://localhost:3000")
const p4 = io("http://localhost:3000")



p1.on("connect", () => {
    p1.emit("add-user", "Player1")
})

p1.on("user-added", () => {
    p1.emit("seat-user", {})
})

p1.on("your-turn", (data) => {
    console.log("P1 allowed actions:", data.allowedactions)
    // automatically act
    if(data.allowedactions.includes("check")){
        p1.emit("useraction", { type: "check" })
    } else {
        p1.emit("useraction", { type: "fold" })
    }
})

