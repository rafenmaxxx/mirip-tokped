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

  /**
   * Get ALL users without pagination
   */
  async getAll() {
    const res = await db.query("SELECT * FROM users ORDER BY user_id DESC");
    return res.rows;
  },

  /**
   * Get users with pagination
   */
  async getAllPaginated(options = {}) {
    const { page = 1, limit = 6, search = "", role = "" } = options;
    const offset = (page - 1) * limit;

    let conditions = [];
    let queryParams = [];

    conditions.push(`role::text != 'ADMIN'`);

    if (search) {
      conditions.push(
        `(name ILIKE $${queryParams.length + 1} OR email ILIKE $${
          queryParams.length + 1
        })`
      );
      queryParams.push(`%${search}%`);
    }

    if (role) {
      conditions.push(`UPPER(role::text) = $${queryParams.length + 1}`);
      queryParams.push(role.toUpperCase());
    }

    const searchCondition = `WHERE ${conditions.join(" AND ")}`;

    const countQuery = `SELECT COUNT(*) as total FROM users ${searchCondition}`;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    const dataQuery = `
      SELECT * FROM users 
      ${searchCondition}
      ORDER BY user_id DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const dataResult = await db.query(dataQuery, [
      ...queryParams,
      limit,
      offset,
    ]);

    return {
      users: dataResult.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
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

  async getAllUserIds() {
    const res = await db.query("SELECT user_id FROM users");

    return res.rows.map((row) => row.user_id);
  },
};

export default UserService;
