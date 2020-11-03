const express = require('express');
const app = express();
const connectDB = require('./config/db');

//Init Middleware
app.use(express.json( {extended:false} ));
//Connect DB
connectDB();

app.get('/',(req, res) => res.send('API Running'));

app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profiles', require('./routes/api/profiles'));
app.use('/api/posts', require('./routes/api/posts'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=> console.log(`Runinng at ${PORT}`));
