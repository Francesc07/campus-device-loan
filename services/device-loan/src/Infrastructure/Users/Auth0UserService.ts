// src/Infrastructure/Users/Auth0UserService.ts
import { IUserService } from "../../Application/Interfaces/IUserService";
import fetch from "node-fetch";

export class Auth0UserService implements IUserService {
  private domain: string;
  private token: string;

  constructor(domain: string, token: string) {
    this.domain = domain;
    this.token = token;
  }

  async getUserEmail(userId: string, accessToken?: string): Promise<string | null> {
    // Prefer frontend-provided accessToken if available
    const tokenToUse = accessToken || this.token;
    try {
      const url = `https://${this.domain}/api/v2/users/${encodeURIComponent(userId)}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
        },
      });
      if (!res.ok) return null;
      const user = await res.json();
      return user.email || null;
    } catch (err) {
      return null;
    }
  }
}
