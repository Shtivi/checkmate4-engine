const app = require('express')()
var cors = require('cors')
var proxy = require('express-http-proxy');
const bodyParser = require('body-parser')
const http = require('http').Server(app)
const chess = require('chess.js').Chess
const Stockfish = require('./stockfish')


app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cors())

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

// app.post('/modelHealthCheck', (req, res) => {
  
//   req.get({url: 'http://34.75.161.24:5000/', headers: req.headers});

//   processRequest(req);
//   res.setHeader('Content-Type', 'application/json');
//   res.send('Req OK');
// })

//app.post('/modelHealthCheck').pipe(request('http://34.75.161.24:5000/'))

app.use('/modelHealthCheck', proxy('http://34.75.161.24:5000/', {
  forwardPath: function (req, res) {
    return 'returnString' + req.url
  }
}))

app.get('/', (req, res) => {
  res.status(200).json("Hello World")
})

app.post('/nextmove', async (req, res) => {
  // Initialize new stockfish instance
  console.log("next move request", req.body)
  const stockfish = new Stockfish()
  stockfish.setupBoard()

  const { fen, difficulty } = req.body

  if (!fen) {
    res.status(400).json('missingFen')
    return
  }

  try {
    const bestmove = await stockfish.getBestMove(fen, difficulty)
    res.send(bestmove)
  } catch (ex) {
    console.error('failed to calculate next move', JSON.stringify(ex))
    res.status(500).json('failed to calculate next move', JSON.stringify(ex)) 
  }
})

const port = process.env.PORT || 80
http.listen(port, () => {
  console.log(`Sever listening on *:${port}`)
})
