import express from "express";
import cors from "cors";
import prisma from "../../lib/prisma.ts";

const app = express();

app.use(cors()); // Allows your React app to talk to this server
app.use(express.json());

app.get("/api/presets", async (req, res) => {
  const logs = await prisma.presets.findMany();
  res.json(logs);
});

app.get("/api/presets/:id", async (req, res) => {
  const { id } = req.params;
  const log = await prisma.presets.findUnique({
    where: { id },
    include: {
      Solutions: true, // This name must match the relation field in your schema
    },
  });
  res.json(log);
});

app.post("/api/records", async (req, res) => {
  const { presetId, time, username } = req.body;
  const log = await prisma.record.create({
    data: {
      presetId,
      time,
      username,
    },
  });
  res.json(log);
});

app.get("/api/records", async (req, res) => {
  
  const logs = await prisma.record.findMany();
  res.json(logs);
}); 
    
app.listen(3001, () => console.log("Server running on port 3001"));
