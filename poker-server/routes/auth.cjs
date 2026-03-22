const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const pool = require("../DB/db.cjs")

router.post("/register", async (req, res) => {
    const { username, password } = req.body
    try {
        const hashed = await bcrypt.hash(password, 10)
        const result = await pool.query(
            "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, balance",
            [username, hashed]
        )
        const user = result.rows[0]
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        )
        res.json({ token, balance: user.balance })
    } catch (err) {
        res.status(400).json({ error: "Username already taken" })
    }
})

router.post("/login", async (req, res) => {
    const { username, password } = req.body
    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        )
        const user = result.rows[0]
        if (!user) return res.status(400).json({ error: "User not found" })

        const match = await bcrypt.compare(password, user.password)
        if (!match) return res.status(400).json({ error: "Wrong password" })

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        )
        res.json({ token, balance: user.balance })
    } catch (err) {
        res.status(500).json({ error: "Server error" })
    }
})

module.exports = router