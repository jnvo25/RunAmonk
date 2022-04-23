const express = require('express');
const path = require('path');

const app = express();
const server = require('http').Server(app);

app.use(express.static(path.join(__dirname, '/public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
});

server.listen(process.env.PORT || 8080, () => { // Uses port set by heroku
  console.log(`Listening on ${server.address().port}`);
});
