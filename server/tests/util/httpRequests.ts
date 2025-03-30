import request from 'supertest'
import app from '../../server.ts'

// a helper function to make a POST request.
function post(url, body) {
  const httpRequest = request(app).post(url)
  httpRequest.send(body)
  httpRequest.set('Accept', 'application/json')
  httpRequest.set('Origin', 'http://localhost:5000')
  return httpRequest
}

// a helper function to make a GET request.
function get(url) {
  const httpRequest = request(app).get(url)
  httpRequest.set('Accept', 'application/json')
  httpRequest.set('Origin', 'http://localhost:5000')
  return httpRequest
}

// a helper function to make a PATCH request.
function patch(url, body) {
  const httpRequest = request(app).patch(url)
  httpRequest.send(body)
  httpRequest.set('Accept', 'application/json')
  httpRequest.set('Origin', 'http://localhost:5000')
  return httpRequest
}

// a helper function to make a DELETE request.
function del(url) {
  const httpRequest = request(app).delete(url)
  httpRequest.set('Accept', 'application/json')
  httpRequest.set('Origin', 'http://localhost:5000')
  return httpRequest
}

export default {
  post,
  get,
  patch,
  del,
  delete: del,
}
