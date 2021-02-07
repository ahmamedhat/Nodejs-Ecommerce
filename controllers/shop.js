const path = require("path");
const fs = require("fs");
const PDFdoc = require('pdfkit');

const Product = require("../models/product");
const Order = require("../models/order");

const e = require("express");

exports.getIndex = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "shop",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("shop/products-list", {
        prods: products,
        pageTitle: "All Products",
        path: "products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const id = req.params.productId;
  Product.findById(id)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        path: "products",
        pageTitle: product.title,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items;
      res.render("shop/cart", {
        pageTitle: "Cart",
        path: "cart",
        products: products,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId).then((product) => {
    req.user.addToCart(product).then(() => {
      res.redirect("/cart");
    });
  });
};

exports.deleteFromCart = (req, res, next) => {
  const id = req.body.itemId;
  req.user
    .removeFromCart(id)
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCreateOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then(() => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      orders = orders.slice().reverse();
      res.render("shop/orders", {
        pageTitle: "Orders",
        path: "orders",
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.getCheckout = (req, res, next) => {
  res.render("shop/checkout", { pageTitle: "Checkout", path: "checkout" });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No Order Found"));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Not authorized"));
      }
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("invoices", invoiceName);
      const pdf = new PDFdoc();
      res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          'inline; filename="' + invoiceName + '"'
        );
      pdf.pipe(fs.createWriteStream(invoicePath));
      pdf.pipe(res);
      pdf.fontSize(26).text('Invoice');
      let totalPrice = 0;
      order.products.forEach(product => {
        pdf.text(' ');
        let pTotal = product.product.price * product.quantity;
        pdf.fontSize(16).text(product.product.title + ' - (' + product.quantity + ') - ' +'$'+ pTotal );
        totalPrice += pTotal;
      });
      pdf.text(' ');
      pdf.text(' ');
      pdf.text(' ');
      pdf.fontSize(20).text('Total: ' +'$'+ totalPrice);
      pdf.end();
    })
    .catch((err) => next(err));
};
