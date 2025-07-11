// mongoConnect.js
const { MongoClient, ServerApiVersion } = require('mongodb');

// Din connection string (lösenord inkluderat)
const uri = "mongodb+srv://Amsby:EtyhYo7WVbPSnzbw@alicetest.ivnwbfu.mongodb.net/?retryWrites=true&w=majority&appName=Alicetest";

// Skapa klient med stabil API-version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Anslut till databasen
    await client.connect();
    console.log("MongoDB ansluten!");

    // Välj databas och samling
    const database = client.db("babyKassanDB");
    const users = database.collection("users");

    // Lägg till exempeldata (kommentera bort efter första körningen)
    /*
    await users.insertOne({
      name: "Mohammad",
      city: "Uppsala",
      gender: "man",
      age: 37,
      sgi: 620000
    });
    console.log("Exempel-användare tillagd!");
    */

    // Hämta och visa de första 5 användarna
    const firstUsers = await users.find().limit(5).toArray();
    console.log("Första 5 användare i databasen:", firstUsers);

  } catch (error) {
    console.error("Fel vid MongoDB-anslutning eller operation:", error);
  } finally {
    // Stäng anslutningen
    await client.close();
    console.log("MongoDB anslutning stängd.");
  }
}

// Kör funktionen och fånga eventuella fel
run().catch(console.dir);
