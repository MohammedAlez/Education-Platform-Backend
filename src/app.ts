import authRoutes from "./modules/auth/auth.routes";
import teacherRoutes from "./modules/teachers/teacher.routes";
import studentRoutes from "./modules/students/student.routes";
import classRoutes from "./modules/classes/class.routes";
import express from "express"



const PORT = process.env.PORT || 3500
const app = express()

app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/classes", classRoutes);


app.listen(PORT, ()=>{
    console.log("server is running")
})