import authRoutes from "./modules/auth/auth.routes";
import express from "express"



const PORT = process.env.PORT || 3500
const app = express()


app.use("/api/auth", authRoutes);


app.listen(PORT, ()=>{
    console.log("server is running")
})