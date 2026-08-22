import authRoutes from "./modules/auth/auth.routes";
import teacherRoutes from "./modules/teachers/teacher.routes";
import studentRoutes from "./modules/students/student.routes";
import express from "express"



const PORT = process.env.PORT || 3500
const app = express()

app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);

app.listen(PORT, ()=>{
    console.log("server is running")
})