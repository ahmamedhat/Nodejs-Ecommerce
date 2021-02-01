const Product = require("../models/product");

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Buy",
    path: "buyProduct",
    editing: false,
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user
  });
  product
    .save()
    .then((result) => {
      res.redirect("/admin/all-products");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    res.render("/");
  }
  const id = req.params.productId;
  Product.findById(id)
    .then((product) => {
      if (!product) {
        res.redirect("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit",
        path: "editProduct",
        editing: true,
        product: product,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const uTitle = req.body.title;
  const uImageUrl = req.body.imageUrl;
  const uPrice = req.body.price;
  const uDescription = req.body.description;
  Product.findById(prodId)
    .then((product) => {
      product.title = uTitle;
      product.price = uPrice;
      product.description = uDescription;
      product.imageUrl = uImageUrl;
      return product.save();
    })
    .then(() => {
      res.redirect("/admin/all-products");
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.postDeleteProduct = (req, res, next) => {
  const id = req.body.productId;
  Product.findByIdAndRemove(id)
    .then(() => {
      res.redirect("/admin/all-products");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("admin/all-products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "admin/products",
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
