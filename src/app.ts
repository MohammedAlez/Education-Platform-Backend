import authRoutes from "./modules/auth/auth.routes";
import teacherRoutes from "./modules/teachers/teacher.routes";
import studentRoutes from "./modules/students/student.routes";
import classRoutes from "./modules/classes/class.routes";
import subjectRoutes from "./modules/subjects/subject.routes";
import teachingAssignmentRoutes from "./modules/teaching-assignments/teaching-assignments.routes";
import enrollmentRoutes from "./modules/student-enrollments/student-enrollments.routes";
import attendancetRoutes from "./modules/attendance/attendance.routes";
import gradestRoutes from "./modules/grades/grade.routes";
import paymentRoutes from "./modules/payments/payment.routes";

import express from "express"



const PORT = process.env.PORT || 5500
const app = express()

app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/teaching-assignments",teachingAssignmentRoutes);
app.use("/api/enrollments",enrollmentRoutes);
app.use("/api/attendance",attendancetRoutes);
app.use("/api/grades",gradestRoutes);
app.use("/api/payments",paymentRoutes);
app.get("/hello",(req, res)=>{
    res.send("it's working fine!!")
});

app.listen(PORT, ()=>{
    console.log("server is running on PORT " + PORT)
})