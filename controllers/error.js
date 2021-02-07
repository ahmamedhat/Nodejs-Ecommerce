exports.error404 = (req, res, next) => {
  res
    .status(404)
    .render("404", {
      pageTitle: "Not Found",
      path: "error",
      isAuthenticated: req.session.isLoggedIn,
    });
};


exports.error500 = (req, res, next) => {
  res
    .status(500)
    .render("500", {
      pageTitle: "Error",
      path: "error",
      isAuthenticated: req.session.isLoggedIn,
    });
};
