const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { check, body } = require("express-validator/check");
const authController = require("../controllers/auth");

router.get("/login", authController.getLogin);
router.get("/signup", authController.getSignup);
router.get("/reset", authController.getReset);
router.get("/reset/:token", authController.getNewPassword);

router.post("/reset", authController.postReset);
router.post(
  "/login",
  [
    body('email')
      .isEmail()
      .withMessage('Invalid Credentials').normalizeEmail(),
    body('password', 'Invalid Credentials')
      .isLength({ min: 8 }).trim()
  ],
  authController.postLogin
);
router.post("/logout", authController.postLogout);
router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Invalid Email")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject("Email Already Exists");
          }
        });
      }).normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Enter a Password of at Least 8 Characters").trim(),
    body("confirmPassword").trim().custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords have to Match");
      }
      return true;
    }),
  ],
  authController.postSignup
);
router.post("/new-password", authController.postNewPassword);

module.exports = router;
