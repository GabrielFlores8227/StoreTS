import express from "express"
import adminApi from "./adminApi/adminApi"

const admin = express.Router()

admin.use("/api", adminApi)

export default admin