/**
 * DTO representing a standardized API error response.
 */
export interface ErrorResponseDto {
  success: false;
  error: string;
  message: string;
  timestamp?: string;
  path?: string;
}
