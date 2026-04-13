/**
 * Represents the HTTP methods used in requests.
 *
 * This type defines the set of standard HTTP methods that can be used
 * to indicate the desired action to be performed for a resource.
 *
 * Valid values include:
 * - "GET": Used to retrieve data from the server.
 * - "POST": Used to send data to the server, typically resulting in the creation of a resource.
 * - "DELETE": Used to delete a specified resource on the server.
 * - "PUT": Used to update or create a resource on the server.
 * - "PATCH": Used to apply partial modifications to a resource.
 */
export type HttpMethod = "GET" | "POST" | "DELETE" | "PUT" | "PATCH";

/**
 * Enumeration representing standard HTTP status codes.
 *
 * Each code is associated with a specific HTTP response status,
 * providing information about the success or failure of an HTTP request.
 *
 * The following categories are represented:
 * - 2xx: Success codes
 * - 4xx: Client error codes
 * - 5xx: Server error codes
 */
export enum HttpCodes {
  OK = 200,
  CREATED = 201,

  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  CONFLICT = 409,
  I_AM_TEAPOT = 418,

  SERVER_ERROR = 500,
}
