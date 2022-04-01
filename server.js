const express = require("express")
const dotenv = require("dotenv").config()
const path = require("path")
const app = express()

app.use(express.static(path.join(__dirname, 'public')));

app.listen(process.env.PORT || 5000, ()=> {
  console.log("Server running..")
})