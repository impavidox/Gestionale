// club-manager-backend/shared/utils/responseHelper.js

const createResponse = (status, data, message = null) => {
  return {
    status,
    body: JSON.stringify({
      success: status >= 200 && status < 300,
      returnCode: status >= 200 && status < 300, // Frontend compatibility
      data,
      message,
      timestamp: new Date().toISOString()
    }),
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
  return {
    status,
    body: JSON.stringify({
      success: false,
      returnCode: false, // Frontend compatibility
      data: null,
      message,
      error: error ? error.toString() : null,
      timestamp: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  };
};

const createSuccessResponse = (data, message = null) => {
  return {
    status: 200,
    body: JSON.stringify({
      success: true,
      returnCode: true, // Frontend compatibility
      data,
      message,
      timestamp: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  };
};

module.exports = {
  createResponse,
  createErrorResponse,
  createSuccessResponse
};