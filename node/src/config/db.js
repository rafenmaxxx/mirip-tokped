import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PG_HOST || "postgres",
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DB,
});

pool
  .connect()
  .then((client) => {
    console.log("Connected to PostgreSQL!");
    client.release();
  })
  .catch((err) => console.error("PostgreSQL connection error:", err));

export default {
  query: (text, params) => pool.query(text, params),
};
