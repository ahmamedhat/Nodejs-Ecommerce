const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const { body } = require("express-validator/check");
const isAuth = require("../middleware/is-auth");

router.get("/add-product", isAuth, adminController.getAddProduct);
router.get("/all-products", isAuth, adminController.getProducts);
router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post("/edit-product", [
    body("title").isLength({ min: 3 }).isString().trim(),
    body("price").isFloat(),
    body("description").isLength({ min: 5 }).trim()
  ], isAuth, adminController.postEditProduct);
router.post(
  "/add-product",
  [
    body("title").isLength({ min: 3 }).isString().trim(),
    body("price").isFloat(),
    body("description").isLength({ min: 5 }).trim()
  ],
  isAuth,
  adminController.postAddProduct
);
router.delete("/product/:productId", isAuth, adminController.deleteProduct);

module.exports = router;
