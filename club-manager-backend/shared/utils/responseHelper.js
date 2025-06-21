const createResponse = (status, data, message = null) => {
  return {
    status,
    jsonBody: {
      success: status >= 200 && status < 300,
      data,
      message,
      timestamp: new Date().toISOString()
    },
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  };
};

const createErrorResponse = (status, message, error = null) => {
  console.error('Error:', message, error);
  return createResponse(status, null, message);
};

const createSuccessResponse = (data, message = null) => {
  return createResponse(200, data, message);
};

module.exports = {
  createResponse,
  createErrorResponse,
  createSuccessResponse
};