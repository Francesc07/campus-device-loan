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
    const usingAccessToken = !!accessToken;
    
    try {
      const url = `https://${this.domain}/api/v2/users/${encodeURIComponent(userId)}`;
      console.log(`🔐 Auth0UserService: Calling Auth0 Management API`);
      console.log(`🔐 URL: ${url}`);
      console.log(`🔐 Using: ${usingAccessToken ? 'User Access Token' : 'Management API Token'}`);
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
        },
      });
      
      console.log(`🔐 Auth0 API Response Status: ${res.status} ${res.statusText}`);
      
      if (!res.ok) {
        const errorBody = await res.text();
        console.error(`❌ Auth0 API Error: ${res.status} - ${errorBody}`);
        return null;
      }
      
      const user = await res.json();
      console.log(`🔐 Auth0 User Data:`, JSON.stringify({
        user_id: user.user_id,
        email: user.email,
        email_verified: user.email_verified,
        name: user.name,
        nickname: user.nickname,
        hasEmail: !!user.email
      }, null, 2));
      
      if (!user.email) {
        console.warn(`⚠️ Auth0 user ${userId} has no email in profile`);
      }
      
      return user.email || null;
    } catch (err) {
      console.error(`❌ Auth0UserService Exception:`, err);
      return null;
    }
  }
}
