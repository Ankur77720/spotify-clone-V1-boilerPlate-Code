const path = require('path')
const crypto = require('crypto')
const mongoose = require('mongoose')
const multer = require('multer')
const { GridFsStorage } = require('multer-gridfs-storage')

const conn = mongoose.createConnection('mongodb://0.0.0.0/spotify')

const db = mongoose.connection
var musicStorage = new GridFsStorage({
  url: 'mongodb://0.0.0.0/spotify',
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err)
        }
        const filename =
          Date.now().toString() +
          '-' +
          buf.toString('hex') +
          path.extname(file.originalname)
        const fileInfo = {
          filename: filename,
          bucketName: 'music',
        }
        resolve(fileInfo)
      })
    })
  },
})
var posterStorage = new GridFsStorage({
  url: 'mongodb://0.0.0.0/spotify',
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err)
        }
        const filename =
          Date.now().toString() +
          '-' +
          buf.toString('hex') +
          path.extname(file.originalname)
        const fileInfo = {
          filename: filename,
          bucketName: 'poster',
        }
        resolve(fileInfo)
      })
    })
  },
})

const upload = multer({ storage: musicStorage })
const posterUpload = multer({ storage: posterStorage })
module.exports = {
  upload: upload,
  conn: conn,
  db: db,
  posterUpload: posterUpload,
}
