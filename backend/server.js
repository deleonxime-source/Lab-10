import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Sequelize, DataTypes } from "sequelize";
import { createRemoteJWKSet, jwtVerify } from "jose";

dotenv.config();

const JWKS = createRemoteJWKSet(
  new URL(`https://api.asgardeo.io/t/${process.env.ASGARDEO_ORG}/oauth2/jwks`)
);

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const token = authHeader.split(" ")[1];

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://api.asgardeo.io/t/${process.env.ASGARDEO_ORG}/oauth2/token`,
      audience: process.env.ASGARDEO_CLIENT_ID,
    });

    req.userId = payload.sub; 
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

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
    user_id: { type: DataTypes.STRING, allowNull: false }, // ⭐ row-level security
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

app.get("/puppies", authMiddleware, async (req, res) => {
  try {
    const puppies = await Puppies.findAll({
      where: { user_id: req.userId }
    });
    res.json(puppies);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch puppies" });
  }
});


app.get("/puppies/:id", authMiddleware, async (req, res) => {
  try {
    const puppy = await Puppies.findByPk(req.params.id);

    if (!puppy) return res.status(404).json({ error: "Puppy not found" });
    if (puppy.user_id !== req.userId)
      return res.status(403).json({ error: "Not your puppy" });

    res.json(puppy);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch puppy" });
  }
});

app.post("/puppies", authMiddleware, async (req, res) => {
  try {
    const newPuppy = await Puppies.create({
      ...req.body,
      user_id: req.userId,
    });

    res.status(201).json(newPuppy);
  } catch (error) {
    res.status(500).json({ error: "Failed to create puppy" });
  }
});

app.put("/puppies/:id", authMiddleware, async (req, res) => {
  try {
    const puppy = await Puppies.findByPk(req.params.id);

    if (!puppy) return res.status(404).json({ error: "Puppy not found" });
    if (puppy.user_id !== req.userId)
      return res.status(403).json({ error: "Not your puppy" });

    await puppy.update(req.body);
    res.json(puppy);
  } catch (error) {
    res.status(500).json({ error: "Failed to update puppy" });
  }
});

app.delete("/puppies/:id", authMiddleware, async (req, res) => {
  try {
    const puppy = await Puppies.findByPk(req.params.id);

    if (!puppy) return res.status(404).json({ error: "Puppy not found" });
    if (puppy.user_id !== req.userId)
      return res.status(403).json({ error: "Not your puppy" });

    await puppy.destroy();
    res.json({ message: "Puppy deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete puppy" });
  }
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

startServer();
