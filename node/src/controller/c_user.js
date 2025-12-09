import { UserService } from "../service/s_user.js";

export const UserController = {
  async getAll(req, res, next) {
    try {
      const search = req.query.search || "";
      const role = req.query.role || "";
      const hasPage = req.query.page !== undefined;
      const hasLimit = req.query.limit !== undefined;

      // if page or limit exists, use pagination
      const usePagination = hasPage || hasLimit;

      if (usePagination) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;

        // Validate parameters
        if (page < 1) {
          return res.status(400).json({
            status: "error",
            message: "Page must be >= 1",
          });
        }

        if (limit < 1 || limit > 100) {
          return res.status(400).json({
            status: "error",
            message: "Limit must be between 1 and 100",
          });
        }

        const result = await UserService.getAllPaginated({
          page,
          limit,
          search,
          role,
        });

        return res.status(200).json({
          status: "success",
          message: "Berhasil mendapatkan data user",
          data: result.users,
          pagination: result.pagination,
        });
      } else {
        console.log(`Fetching ALL users (no pagination), search="${search}"`);

        const users = await UserService.getAll(search);

        return res.status(200).json({
          status: "success",
          message: "Berhasil mendapatkan semua user",
          data: users,
          total: users.length,
        });
      }
    } catch (error) {
      console.error("Get all users error:", error);
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const user = await UserService.getById(req.params.id);

      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User tidak ditemukan",
        });
      }

      return res.status(200).json({
        status: "success",
        data: user,
      });
    } catch (error) {
      console.error("Get user by ID error:", error);
      next(error);
    }
  },

  async getMe(req, res, next) {
    try {
      const user = await UserService.getMe(
        req.params.sessid || req.cookies.PHPSESSID
      );

      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User tidak ditemukan",
        });
      }

      return res.status(200).json({
        status: "success",
        data: user,
      });
    } catch (error) {
      console.error("Get me error:", error);
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const newUser = await UserService.create(req.body);

      return res.status(201).json({
        status: "success",
        message: "User berhasil dibuat",
        data: newUser,
      });
    } catch (error) {
      console.error("Create user error:", error);
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const result = await UserService.remove(req.params.id);

      return res.status(200).json({
        status: "success",
        message: "User berhasil dihapus",
        data: result,
      });
    } catch (error) {
      console.error("Remove user error:", error);
      next(error);
    }
  },
};
