const express = require("express");
const bodyParser = require("body-parser");
//TO USE MONGOOSE
const mongoose = require("mongoose");
//USE THE LODASH
const _ = require("lodash");
require("dotenv").config();

const port = process.env.PORT || 4000;
const app = express();

//TO USE EJS WITH EXPRESS
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

//TO USE THE CSS STYLES
app.use(express.static("public"));

mongoose.set("strictQuery", true);
mongoose.connect(process.env.ATLAS_URL);

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
  },
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todoList!",
});

const defaultItems = [item1];

//TO THE ROUTES
const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

//TO LIST THE ITEMS
app.get("/", function (req, res) {
  Item.find({}, function (err, item) {
    //TO NOT REPEAT THE ARRAY
    if (item.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: item });
    }
  });
});

//TO MAKE ANOTHER ROUTES
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (err) {
      console.log(err);
    }
    if (!foundList) {
      //CREATE A NEW LIST
      const list = new List({
        name: customListName,
        items: defaultItems,
      });

      list.save();
      res.redirect("/" + customListName);
    } else {
      //SHOW AN EXISTING LIST
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  });
});

//TO CREATE A NEW ITEM
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

//TO DELETE AN ITEM
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Remove with sucess!");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.listen(port, () => {
  console.log(`Server started on ${port}`);
});
