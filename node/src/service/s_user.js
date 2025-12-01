import db from "../config/db.js";

export const UserService = {
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
