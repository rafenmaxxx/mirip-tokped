import { FlagsService } from "../service/s_flags.js";
import { UserService } from "../service/s_user.js";

export const requireAuctionEnabled = async (req, res, next) => {
  try {
    let userId = req.body?.user_id || req.body?.userId || req.params?.userId || req.query?.userId || req.body?.seller_id || req.body?.buyer_id;

    if (!userId && req.cookies?.PHPSESSID) {
      const user = await UserService.getMe(req.cookies.PHPSESSID);
      if (user && user.user_id) {
        userId = user.user_id;
      }
    }

    if (!userId) {
      return res.status(400).json({
        status: "error",
        message: "User ID diperlukan",
      });
    }

    const result = await FlagsService.isAllowedAuction(userId);

    if (!result.isAllowed) {
      return res.status(403).json({
        status: "error",
        message: result.reason || "Fitur auction tidak tersedia untuk akun Anda",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal memeriksa akses fitur",
    });
  }
};

export const requireChatEnabled = async (req, res, next) => {
  try {
    let userId = req.body?.user_id || req.body?.userId || req.params?.userId || req.query?.userId || req.body?.buyer_id || req.body?.sender_id;

    if (!userId && req.cookies?.PHPSESSID) {
      const user = await UserService.getMe(req.cookies.PHPSESSID);
      if (user && user.user_id) {
        userId = user.user_id;
      }
    }

    if (!userId) {
      return res.status(400).json({
        status: "error",
        message: "User ID diperlukan",
      });
    }

    const result = await FlagsService.isAllowedChat(userId);

    if (!result.isAllowed) {
      return res.status(403).json({
        status: "error",
        message: result.reason || "Fitur chat tidak tersedia untuk akun Anda",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal memeriksa akses fitur",
    });
  }
};

export const requireCheckoutEnabled = async (req, res, next) => {
  try {
    let userId = req.body?.user_id || req.body?.userId || req.params?.userId || req.query?.userId || req.body?.buyer_id;

    if (!userId && req.cookies?.PHPSESSID) {
      const user = await UserService.getMe(req.cookies.PHPSESSID);
      if (user && user.user_id) {
        userId = user.user_id;
      }
    }

    if (!userId) {
      return res.status(400).json({
        status: "error",
        message: "User ID diperlukan",
      });
    }

    const result = await FlagsService.isAllowedCheckout(userId);

    if (!result.isAllowed) {
      return res.status(403).json({
        status: "error",
        message: result.reason || "Fitur checkout tidak tersedia untuk akun Anda",
      });
    }

    next();
  } catch (error) {
    console.error("Checkout feature check error:", error);
    return res.status(500).json({
      status: "error",
      message: "Gagal memeriksa akses fitur",
    });
  }
};
