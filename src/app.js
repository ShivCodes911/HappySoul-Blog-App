import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js" ;
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import bookmarkRouter from "./routes/bookmark.routes.js";


const app = express();

app.set('trust proxy', 1);

app.use(cors({
    origin: [
      'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 
      'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3003', 
      'http://localhost:3004', 'http://localhost:3005', 'http://localhost:3006',
      ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(s => s.trim().replace(/\/+$/, '')) : [])
    ],
    credentials: true,
    methods: ['GET','POST','DELETE','PUT','PATCH','OPTIONS'],
    allowedHeaders: ['Authorization','Content-Type']
  }));

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());


app.get("/",(req,res)=>{
    res.send("System is Running");
});



app.use("/api/v1/auth", userRouter);
app.use("/api/v1/post", postRouter);
app.use("/api/v1", commentRouter);
app.use("/api/v1", likeRouter);
app.use("/api/v1", bookmarkRouter);




export default app;
