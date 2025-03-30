import request, { Test } from 'supertest'
import app from '../../server.ts'

// a helper function to make a POST request.
function post(url: string, body: any): Test {
  const httpRequest = request(app).post(url)
  httpRequest.send(body)
  httpRequest.set('Accept', 'application/json')
  httpRequest.set('Origin', `http://localhost:${process.env.PORT}`)
  return httpRequest
}

// a helper function to make a GET request.
function get(url: string): Test {
  const httpRequest = request(app).get(url)
  httpRequest.set('Accept', 'application/json')
  httpRequest.set('Origin', `http://localhost:${process.env.PORT}`)
  return httpRequest
}

// a helper function to make a PATCH request.
function patch(url: string, body: any): Test {
  const httpRequest = request(app).patch(url)
  httpRequest.send(body)
  httpRequest.set('Accept', 'application/json')
  httpRequest.set('Origin', `http://localhost:${process.env.PORT}`)
  return httpRequest
}

// a helper function to make a DELETE request.
function del(url: string): Test {
  const httpRequest = request(app).delete(url)
  httpRequest.set('Accept', 'application/json')
  httpRequest.set('Origin', `http://localhost:${process.env.PORT}`)
  return httpRequest
}

export default {
  post,
  get,
  patch,
  del,
  delete: del,
}
