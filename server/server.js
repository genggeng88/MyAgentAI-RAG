import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import chat from "./chat.js"
import chatMCP from "./chat-mcp.js";

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());

// Configure multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "uploads/"));
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });

const PORT = 5001;
let filePath;

app.post("/upload", upload.single("file"), (req, res) => {
    // use multer to handle file upload
    filePath = req.file.path;     // the path where the file is temporarily saved
    res.send(filePath + " uploaded successfully.");
});

app.get("/chat", async (req, res) => {
    const ragResp = await chat(filePath, req.query.question); // use MCP-enhanced chat
    const mcpResp = await chatMCP(req.query.question);
    res.send({
        ragAnswer: ragResp.text,
        mcpAnswer: mcpResp.text,
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})