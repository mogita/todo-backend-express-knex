import express from 'express'
import bodyParser from 'body-parser'
import morgan from 'morgan'

const app = express()

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
)

app.use(function (_, res, next) {
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE')
  res.header('Access-Control-Allow-Origin', '*')
  next()
})

export default app
