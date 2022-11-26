const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Book Palace Server is Running.....");
});

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.cybkh1s.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const categoryCollection = client.db("bookPalace").collection("categories");
    const usersCollection = client.db("bookPalace").collection("users");
    const booksCollection = client.db("bookPalace").collection("books");
    const bookingsCollection = client.db("bookPalace").collection("bookings");

    //get categories data
    app.get("/categories", async (req, res) => {
      const query = {};
      const categories = await categoryCollection.find(query).toArray();
      res.send(categories);
    });

    app.get("/categories/:category", async (req, res) => {
      const category = req.params.category;
      // console.log(category);
      const query = { category: category };
      const result = await booksCollection.find(query).toArray();
      res.send(result);
    });

    //get users by email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send(user);
    });

    //post user data
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // get added book by specific email
    app.get("/books/mybooks/:email", async (req, res) => {
      const email = req.params.email;
      // const decodedEmail = req.decoded.email;
      // // console.log(decoded);
      // if (email !== decodedEmail) {
      //   res.status(403).send({ message: "Forbidden Access" });
      // }

      const query = {
        "seller.email": email,
      };
      const myBooks = await booksCollection.find(query).toArray();
      res.send(myBooks);
    });

    //API for add Product
    app.post("/books", async (req, res) => {
      const book = req.body;
      const result = await booksCollection.insertOne(book);
      res.send(result);
    });

    //Add bookings
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    //

    //
  } finally {
  }
}
run().catch((error) => console.log(error));

app.listen(port, () => {
  console.log("Book Palace Server Running on Port:", port);
});
