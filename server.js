const express = require('express')
const fs = require('fs')
const db = require('./database')
const path = require('path')

// 1
const multer = require('multer')

const app = express()
// 2
const upload = multer({ dest: 'images/' })

app.use(express.static("build"));
app.use("/images",express.static("./images"));
// 3

app.get('/api/images', async (req, res)=> {
//   console.log("getting images...")
  const result = await db.getImages()
  res.send(result)
})


app.post('/api/images', upload.single('image'), async (req, res) => {
  // 4
  const imageName = req.file.filename
  const description = req.body.description

  // Save this data to a database probably

  const result = await db.addImage(imageName,description)
  res.send(result)
})



app.get('/images/:imageName', (req, res) => {
  // do a bunch of if statements to make sure the user is 
  // authorized to view this image, then

  const imageName = req.params.imageName
  const readStream = fs.createReadStream(`images/${imageName}`)
  readStream.pipe(res)
})

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "./build/index.html"))
  })
  
app.listen(8080, () => console.log("listening on port 8080"))