const Product = require("../models/product");
const { validationResult } = require("express-validator/check");
const fileManager = require("../util/file");
const ITEMS_PER_PAGE = 2;


exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Buy",
    path: "buyProduct",
    editing: false,
    hasError: false,
    errorMessage: null,
    errorMessages: [],
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;

  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Buy",
      path: "buyProduct",
      editing: false,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: "Invalid Input For Image File",
      hasError: true,
      errorMessages: [],
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Buy",
      path: "buyProduct",
      editing: false,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: errors.array()[0].msg,
      hasError: true,
      errorMessages: errors.array(),
    });
  }
  const imageUrl = image.path;
  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user,
  });
  product
    .save()
    .then((result) => {
      res.redirect("/admin/all-products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
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
        hasError: false,
        errorMessage: null,
        errorMessages: [],
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const uTitle = req.body.title;
  const image = req.file;
  const uPrice = req.body.price;
  const uDescription = req.body.description;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit",
      path: "editProduct",
      editing: false,
      product: {
        title: uTitle,
        price: uPrice,
        description: uDescription,
        _id: prodId,
      },
      errorMessage: errors.array()[0].msg,
      hasError: true,
      errorMessages: errors.array(),
    });
  }

  Product.findById(prodId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      product.title = uTitle;
      product.price = uPrice;
      product.description = uDescription;
      if (image) {
        fileManager.deletFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      return product.save().then(() => {
        res.redirect("/admin/all-products");
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.deleteProduct = (req, res, next) => {
  const id = req.params.productId;
  Product.findById(id)
    .then((product) => {
      if (!product) {
        return next(new Error("Product Not Found"));
      }
      fileManager.deletFile(product.imageUrl);
      return Product.deleteOne({ _id: id, userId: req.user._id });
    })
    .then(() => {
      res.status(200).json({ message: "success" });
    })
    .catch((err) => {
      res.status(500).json({ message: "fail" });
    });
};

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product.find({ userId: req.user._id })
  .countDocuments()
  .then((prodsCount) => {
    totalItems = prodsCount;
    return Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
  })
    .then((products) => {
      res.render("admin/all-products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "admin/products",
        currentPage: page,
        hasNextPage: page * ITEMS_PER_PAGE < totalItems,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        prevPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)  
      });
    })
    .catch((err) => {
      console.log(err);
      // const error = new Error(err);
      // error.httpStatusCode = 500;
      // return next(error);
    });
};
