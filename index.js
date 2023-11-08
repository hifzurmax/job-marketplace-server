const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


//middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://taskhub-7bbe0.web.app',
        'https://taskhub-7bbe0.firebaseapp.com'
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lalliar.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});



const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    jwt.verify(token, process.env.SECRETE, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' });
        }
        req.user = decoded;
        next();
    })

}


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const jobsCollection = client.db('taskHub').collection('jobs')
        const bidCollection = client.db('taskHub').collection('bids')


        //Auth related API
       





        //Secure APIs

        app.get('/myjobs', verifyToken, async (req, res) => {
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email };
            }
            const result = await jobsCollection.find(query).toArray();
            res.send(result);
        })


        app.get('/mybids', verifyToken, async (req, res) => {
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            let query = {};
            if (req.query?.email) {
                query = { emailBidder: req.query.email };
                console.log('query',query.emailBidder);
            }
            const result = await bidCollection.find(query).toArray();
            console.log(result);
            res.send(result);
        });


        app.get('/bidrequests', async (req, res) => {
            if (req.query?.email) {
                query = { emailBuyer: req.query?.email };
            }
            const result = await bidCollection.find(query).toArray();
            res.send(result);
        });



        app.get('/jobs/:category', async (req, res) => {
            const category = req.params.category;
            const query = { category: category };
            const result = await jobsCollection.find(query).toArray();
            res.send(result);
        });



        app.get('/job/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobsCollection.findOne(query);
            res.send(result);
        })



        app.get('/jobdetails/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobsCollection.findOne(query);
            res.send(result);
        })



        app.get('/jobs', async (req, res) => {
            const cursor = jobsCollection.find();
            const result = await cursor.toArray()
            res.send(result);
        })



        app.post('/job', async (req, res) => {
            const newJob = req.body;
            const result = await jobsCollection.insertOne(newJob);
            res.send(result);
        })


        app.post('/bid', async (req, res) => {
            const bid = req.body;
            const result = await bidCollection.insertOne(bid);
            res.send(result);
        })

        app.patch('/update/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateJob = req.body;

            const job = {
                $set: {
                    title: updateJob.title,
                    category: updateJob.category,
                    image: updateJob.image,
                    minPrice: updateJob.minPrice,
                    maxPrice: updateJob.maxPrice,
                    deadline: updateJob.deadline,
                    description: updateJob.description,
                }
            }
            const result = await jobsCollection.updateOne(filter, job, options);
            res.send(result)
        })

        app.delete('/myjobs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobsCollection.deleteOne(query);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Server Running')
})

app.listen(port, () => {
    console.log(`Serrver is running on port ${port}`);
})