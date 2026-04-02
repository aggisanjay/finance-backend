/**
 * Consistent JSON response wrapper.
 */
class ApiResponse {
  static success(res, { statusCode = 200, message = 'Success', data = null, meta = null }) {
    const response = { success: true, message };
    if (data !== null) response.data = data;
    if (meta !== null) response.meta = meta;
    return res.status(statusCode).json(response);
  }

  static created(res, { message = 'Created successfully', data = null }) {
    return ApiResponse.success(res, { statusCode: 201, message, data });
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

export default ApiResponse;
