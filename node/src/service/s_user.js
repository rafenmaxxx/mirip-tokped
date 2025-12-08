import db from "../config/db.js";
import redis from "../config/redis.js";
import { phpUnserialize } from "../config/redis.js";

export const UserService = {
  async getMe(sessId) {
    const redisKey = `PHPREDIS_SESSION:${sessId}`;
    const raw = await redis.get(redisKey);
    if (!raw) return null;

    const [key, value] = raw.split("|");
    const parsed = phpUnserialize(value);
    const userId = parsed.id;

    if (!userId) return null;
    const res = await db.query("SELECT * FROM users WHERE user_id = $1", [
      userId,
    ]);

    return res.rows[0];
  },

  async getAll() {
    const res = await db.query("SELECT * FROM users ORDER BY user_id DESC");
    return res.rows;
  },

  async getById(id) {
    const res = await db.query("SELECT * FROM users WHERE user_id = $1", [id]);
    return res.rows[0];
  },

  async create(data) {
    const { name, email } = data;
    const res = await db.query(
      `INSERT INTO users (name, email)
       VALUES ($1, $2)
       RETURNING *`,
      [name, email]
    );
    return res.rows[0];
  },

  async remove(id) {
    await db.query("DELETE FROM users WHERE user_id = $1", [id]);
    return { message: "User deleted" };
  },
};
