const app = require('express')()
var cors = require('cors')
var proxy = require('express-http-proxy');
const bodyParser = require('body-parser')
const http = require('http').Server(app)
const chess = require('chess.js').Chess
const Stockfish = require('./stockfish')
const FLASK_SERVER = 'http://34.75.161.24:5000'
const multer = require('multer');
const upload = multer();
const fileUpload = require('express-fileupload');
const axios = require('axios').default
const FormData = require('form-data')

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cors())

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

app.use('/modelHealthCheck', proxy(FLASK_SERVER, {
  forwardPath: function (req, res) {
    return '' + req.url
  }
}))

app.post('/processImg', upload.single('image'), async (req, res) => {
  try {
    const image = req.file

    const formData = new FormData()
    formData.append('image', image.buffer, image.originalname)

    const result = await axios.post(FLASK_SERVER + '/processImg', formData, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
      }
    })

    console.log('image processing result:', result.data)

    res.status(200).json(result.data)
  } catch(ex) {
    console.error(ex)
    res.status(500).json({message: 'failed to handle request', ex})
  }
})

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
