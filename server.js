import express from 'express'
import fs from 'fs'
import * as db from './database.js'
import path from 'path'
import multer from 'multer'
import * as s3 from './s3.js'
import crypto from 'crypto'
//import  S3Client  from '@aws-sdk/client-s3'
import sharp from 'sharp'



const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

const app = express()
// 1
const storage = multer.memoryStorage()
const upload = multer({storage: storage})


app.use(express.static("build"));
app.use("/images",express.static("./images"));
// 3

app.get('/api/images', async (req, res)=> {
//   console.log("getting images...")
  const images = await db.getImages()
  for (const image of images) {
    image.url = await s3.getSignedUrl(image.file_name)
  }

  res.send(images)
})

app.post('/api/images', upload.single('image'), async (req, res) => {
  // Get the data from the post request
  const description = req.body.description
  const fileBuffer = req.file.buffer
  const mimetype = req.file.mimetype
  const fileName = generateFileName()


 // process image here!
 //const fileBufferSharp = await sharp(fileBuffer).resize({ height: 100, width: 100, fit: "contain" }).toBuffer()
 const fileBufferSharp = await sharp(fileBuffer).resize({ height: 920, width: 800, fit: "contain" }).toBuffer()
 // Store the image in s3  
  const s3Result = await s3.uploadImage(fileBufferSharp, fileName, mimetype)
  console.log(s3Result)

  // Save this data to a database probably
  const result = await db.addImage(fileName,description)
  result.url = await s3.getSignedUrl(fileName);
  res.send(result)

})

app.get('/images/:imageName', (req, res) => {
  // do a bunch of if statements to make sure the user is 
  // authorized to view this image, then

  const imageName = req.params.imageName
  const readStream = fs.createReadStream(`images/${imageName}`)
  readStream.pipe(res)
})


// app.post('/api/images/:id/delete', async (req, res)=> {
//   //   console.log("getting images...")
//   const id = +req.params.id
 
//   const deleteParams ={
//     Bucket: bucketName,
//     Key: image.imageName,
//   }

//   return S3Client.send(new DeleteObjectCommand(deleteParams))

//   await db.deleteImage(id)
//   res.send('/api/images')
//   })

  app.post("/api/images/:id/delete", async (req, res) => {
    const id = +req.params.id
   // const fileName = req.params.id 
   const image = await db.getImage(id)
   const result = await db.deleteImage(id)


    const post = await s3.deleteImage(image.file_name)   
    // Delete the image in the database  

    res.redirect('/');  
  })


app.get('*', (req, res) => {
  res.sendFile('build/index.html')})

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`listening on port ${port}`))