// server/src/utils/response.util.js

/**
 * Standardized API success response
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {*} data
 */
export const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

/**
 * Standardized API error response
 */
export const sendError = (res, statusCode = 500, message = 'Server error', error = null) => {
  const response = { success: false, message };
  if (error && process.env.NODE_ENV === 'development') response.error = error;
  return res.status(statusCode).json(response);
};

/**
 * Paginated response wrapper
 */
export const sendPaginated = (res, data, page, limit, total) => {
  return res.json({
    success:    true,
    data,
    pagination: {
      page,
      limit,
      total,
      pages:   Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
};
