import { UserService } from "../service/s_user.js";

export const UserController = {
  async getAll(req, res) {
    const users = await UserService.getAll();
    res.json(users);
  },

  async getById(req, res) {
    const user = await UserService.getById(req.params.id);
    res.json(user);
  },

  async getMe(req, res) {
    const user = await UserService.getMe(req.params.sessid);
    res.json(user);
  },

  async create(req, res) {
    const newUser = await UserService.create(req.body);
    res.json(newUser);
  },

  async remove(req, res) {
    const result = await UserService.remove(req.params.id);
    res.json(result);
  },
};
