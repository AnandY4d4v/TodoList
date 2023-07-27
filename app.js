import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";
import dotenv from "dotenv";
const app = express();


//mongoose.connect("mongodb://127.0.0.1:27017/todoListDB");
mongoose.connect("mongodb+srv://felixfelix:Felix%40453@cluster0.4oc4hbc.mongodb.net/todolistDB");

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

dotenv.config({
  path:"./data/config.env",
});


let workItems=[];
const db = mongoose.connection;

db.on("error", err => {
  console.error("Error connecting to MongoDB:", err.message);
});

db.once("open", () => {
  console.log("Connected to MongoDB!");
});

 let onceInitialiased="No";
const itemsSchema = {
    name:String
}
const Item =mongoose.model("Item",itemsSchema);

const item1 = new Item ({
    name:"Welcome to your todolist!"
});
const item2 = new Item ({
    name:"Hit the + button to add a new items"
});

const item3 = new Item ({
  name:"<-- press to delete item"
});

const defaultItems = [item1, item2,item3];

const listSchema = {
  name:String,
  items:[itemsSchema]
};

const List =mongoose.model("list",listSchema);

app.get("/",async function(req,res){
  console.log(onceInitialiased);
  if(onceInitialiased==="Yes"){
    const foundItems = await Item.find({});
    res.render("list",{listTitle:"Today",newListItems:foundItems});
  }
  else {
    const findItems = async () => {
        try {
          const foundItems = await Item.find({});
          if(foundItems.length===0){

            const insertDefaultItems = async () => {
                try {
                    await Item.insertMany(defaultItems);
                    console.log("Saved todolist items to the database.");
                    onceInitialiased ="Yes";
                } catch (error) {
                    console.error("Error saving default items:", error);
                }
            };
            insertDefaultItems();
            res.redirect("/");
          } else {
            res.render("list",{listTitle:"Today",newListItems:foundItems});
          }
        } catch (error) {
          console.error("Error finding items:", error);
        }
      };
      findItems();
    }

});

app.get("/:customListName", async function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  try {
    const foundList = await List.findOne({ name: customListName });

    if (!foundList) {
      //console.log("Doesn't Exist");
      const list = new List({
        name:customListName,
        items:defaultItems
      });
      list.save();
      res.redirect("/"+ customListName);
    } else {
      //console.log("Exists");
      res.render("list",{listTitle:foundList.name, newListItems:foundList.items});
    }
  } catch (err) {
    console.error(err);
  }
});

app.post("/",async function(req,res){
    const item=req.body.newItem;
    const listName= req.body.list;
    const itemtopush = new Item ({
      name:item
  });

  if(listName==="Today"){
  itemtopush.save();
  res.redirect("/")
  }
  else{
    const Name = await List.findOne({ name: listName });
    Name.items.push(itemtopush);
    Name.save()
    res.redirect("/" + listName)
  }
    
});

app.post("/delete", async function(req, res) {
  const checkedBoxId = req.body.checkbox;
  const listName= req.body.listName;
  //console.log(listName);
  if(listName==="Today"){
    try {
      await Item.findByIdAndDelete(checkedBoxId);
      console.log("Successfully Deleted!");
      res.redirect("/");
    } catch (error) {
      console.log("Error deleting item:", error);
    }
  }
  else {
    try {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedBoxId } } }
      );
      res.redirect("/" + listName);
    } catch (error) {
      console.log("Error updating list:", error);
    }
  }
  
});

app.listen(process.env.PORT,function(){
    console.log("App is running on port" + process.env.PORT );
});