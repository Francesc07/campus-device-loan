// src/Application/Interfaces/IUserService.ts

export interface IUserService {
  /**
   * Fetch user email by userId (e.g., Auth0 or Azure AD subject) and access token
   */
  getUserEmail(userId: string, accessToken?: string): Promise<string | null>;
}
