const express = require("express");
const router = express.Router();
const shopController = require('../controllers/shop');
const isAuth = require("../middleware/is-auth");


router.get("/", shopController.getIndex);
router.get("/cart", isAuth, shopController.getCart);
router.get("/orders", isAuth, shopController.getOrders);
// // router.get("/checkout", shopController.getCheckout);
router.get("/products", shopController.getProducts);
router.get('/products/:productId', shopController.getProduct);

router.post("/create-order", isAuth, shopController.postCreateOrder);
router.post("/cart-delete-item", isAuth, shopController.deleteFromCart);
router.post("/cart", isAuth, shopController.postCart);

module.exports = router;