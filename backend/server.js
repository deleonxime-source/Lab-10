import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Sequelize, DataTypes } from "sequelize";

dotenv.config();

const bearerToken = 'Bearer aaa.eyJzdWIiOiIxMjMifQ.bbb';
const token = bearerToken.slice(7);
const parts = token.split(".");
const header = parts[0];
const payload = parts[1];
const signature = parts[2];

if (token) {
  console.log("TOKEN HAS A VALUE");
} else {
  console.log("Token has no value");
}

console.log("Bearer Token:", bearerToken);
console.log("Token:", token);
console.log("Header:", header);
console.log("Payload:", payload);
console.log("Signature:", signature);

const DB_SCHEMA = process.env.DB_SCHEMA || "app";
const useSsl = process.env.PGSSLMODE === "require";

const app = express();
app.use(cors());
app.use(express.json());

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    dialectOptions: useSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : undefined,
    define: {
      schema: DB_SCHEMA,
    },
  }
);

const Puppies = sequelize.define(
  "puppies",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.TEXT, allowNull: false },
    breed: { type: DataTypes.TEXT, allowNull: false },
    age: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    schema: DB_SCHEMA,
    tableName: "puppies",
    timestamps: false,
  }
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected...");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Error: ", err);
    process.exit(1);
  }
};

// GET all puppies
app.get('/puppies', async (req, res) => {
  try {
    const puppies = await Puppies.findAll();
    res.json(puppies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch puppies' });
  }
});

// GET one puppy
app.get('/puppies/:id', async (req, res) => {
  try {
    const puppy = await Puppies.findByPk(req.params.id);
    if (!puppy) return res.status(404).json({ error: 'Puppy not found' });
    res.json(puppy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch puppy' });
  }
});

// POST
app.post('/puppies', async (req, res) => {
  try {
    const newPuppy = await Puppies.create(req.body);
    res.status(201).json(newPuppy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create puppy' });
  }
});

// PUT
app.put('/puppies/:id', async (req, res) => {
  try {
    const puppy = await Puppies.findByPk(req.params.id);
    if (!puppy) return res.status(404).json({ error: 'Puppy not found' });

    await puppy.update(req.body);
    res.json(puppy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update puppy' });
  }
});

// DELETE
app.delete('/puppies/:id', async (req, res) => {
  try {
    const puppy = await Puppies.findByPk(req.params.id);
    if (!puppy) return res.status(404).json({ error: 'Puppy not found' });

    await puppy.destroy();
    res.json({ message: 'Puppy deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete puppy' });
  }
});



startServer();