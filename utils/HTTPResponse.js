class HTTPResponse {
  constructor(res, success, status_code, message, error, data, from = "DB") {
    this.response = {
      success,
      message,
      error,
      data,
      from,
    };
    this.status_code = status_code;

    res.status(this.status_code).json(this.response);
  }

  getResponse() {
    return { ...this.response, status_code: this.status_code };
  }
}

module.exports = HTTPResponse;
