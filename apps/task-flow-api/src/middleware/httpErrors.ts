export class ApiError extends Error {
  constructor(message: string, public readonly statusCode: number = 400) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
