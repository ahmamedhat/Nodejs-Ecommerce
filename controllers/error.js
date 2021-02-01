exports.error404 = (req, res, next) => {
  res
    .status(404)
    .render("404", {
      pageTitle: "Not Found",
      path: "error",
      isAuthenticated: req.isLoggedIn,
    });
};
