import express from 'express'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import compression from 'compression'

const app = express()

app.use(
  rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 500, // Limit each IP to 0.83 request per second
    message: 'Too many requests from this IP, please try again later.',
  }),
)

app.use(helmet())
app.use(compression())

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
