const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Book Palace Server is Running.....");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.cybkh1s.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

//verifyJWT
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("Unauthorized Access");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

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
      const result = await booksCollection
        .find(query)
        .sort({ $natural: -1 })
        .toArray();
      res.send(result);
    });

    //jwt
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      // console.log(user);

      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "10d",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "UnAuthorized" });
    });

    //get all Users
    app.get("/users", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
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

    //verify a seller
    app.put("/users/verified/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          verified: true,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    //get verified seller
    app.get("/users/seller/verified/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const verifiedSeller = await usersCollection.findOne(query);
      res.send(verifiedSeller);
    });

    //delete user
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    });

    // get added book by specific email
    app.get("/books/mybooks/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const decodedEmail = req.decoded.email;
      // console.log(decoded);
      if (email !== decodedEmail) {
        res.status(403).send({ message: "Forbidden Access" });
      }

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

    //make advertisement
    app.put("/mybooks/advertised/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          advertised: true,
        },
      };
      const result = await booksCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    //get advertised product
    app.get("/mybooks/advertised", async (req, res) => {
      const query = { advertised: true };
      const advertisedBook = await booksCollection
        .find(query)
        .sort({ $natural: -1 })
        .toArray();
      res.send(advertisedBook);
    });

    //Reported product
    app.put("/books/reported/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          reported: true,
        },
      };
      const result = await booksCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    //get reported product
    app.get("/books/reported", verifyJWT, async (req, res) => {
      const query = { reported: true };
      const reportedBook = await booksCollection.find(query).toArray();
      res.send(reportedBook);
    });

    //delete product
    app.delete("/books/mybooks/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await booksCollection.deleteOne(filter);
      res.send(result);
    });

    //get bookings by email
    app.get("/bookings/mybookings/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const decodedEmail = req.decoded.email;
      // console.log(decoded);
      if (email !== decodedEmail) {
        res.status(403).send({ message: "Forbidden Access" });
      }

      const query = {
        "buyer.email": email,
      };
      const myBookings = await bookingsCollection.find(query).toArray();
      res.send(myBookings);
    });

    //Add bookings
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    //delete bookings
    app.delete("/bookings/mybookings/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await bookingsCollection.deleteOne(filter);
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
