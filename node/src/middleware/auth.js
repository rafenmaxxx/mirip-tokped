const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      status: "error",
      message: "Tidak terautentikasi"
    });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      status: "error",
      message: "Tidak terautentikasi"
    });
  }
  
  if (req.session.user.role !== "ADMIN") {
    return res.status(403).json({
      status: "error",
      message: "Akses ditolak. Hanya admin yang dapat mengakses."
    });
  }
  
  next();
};

export { requireAuth, requireAdmin };