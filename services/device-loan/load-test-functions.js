// load-test-functions.js
// Helper functions for Artillery load testing

const { faker } = require('@faker-js/faker');

module.exports = {
  generateTestData,
  beforeRequest,
  afterResponse
};

function generateTestData(userContext, events, done) {
  // Generate realistic test data
  userContext.vars.userId = `user-${faker.string.alphanumeric(8)}`;
  userContext.vars.deviceId = `device-${faker.string.alphanumeric(8)}`;
  
  const loanDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7); // 7 days loan period
  
  userContext.vars.loanDate = loanDate.toISOString();
  userContext.vars.dueDate = dueDate.toISOString();
  
  userContext.vars.requestId = faker.string.uuid();
  
  return done();
}

function beforeRequest(requestParams, context, ee, next) {
  // Add correlation ID to all requests
  requestParams.headers = requestParams.headers || {};
  requestParams.headers['X-Correlation-ID'] = context.vars.requestId || faker.string.uuid();
  requestParams.headers['X-Request-Timestamp'] = new Date().toISOString();
  
  // Log request for debugging
  console.log(`[${new Date().toISOString()}] ${requestParams.method || 'GET'} ${requestParams.url}`);
  
  return next();
}

function afterResponse(requestParams, response, context, ee, next) {
  // Track response times
  const responseTime = response.timings.end;
  
  if (responseTime > 2000) {
    console.warn(`Slow response: ${requestParams.url} took ${responseTime}ms`);
  }
  
  // Track errors
  if (response.statusCode >= 400) {
    console.error(`Error response: ${response.statusCode} for ${requestParams.url}`);
    ee.emit('error', `HTTP ${response.statusCode}`);
  }
  
  return next();
}
