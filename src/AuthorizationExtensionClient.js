import { AuthenticationClient } from "auth0";
import got from "got";

export class AuthorizationExtensionClient {
  authenticationClient;
  cachedToken;
  baseUrl;
  audience;
  constructor() {
    const {
      TENANT_DOMAIN,
      CLIENT_ID,
      CLIENT_SECRET,
      AUTHORIZATION_EXTENSION_API_TOKEN_AUDIENCE,
      AUTHORIZATION_EXTENSION_API_URL
    } = process.env;
    this.authenticationClient = new AuthenticationClient({
      domain: TENANT_DOMAIN,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    });
    this.baseUrl = AUTHORIZATION_EXTENSION_API_URL;
    this.audience = AUTHORIZATION_EXTENSION_API_TOKEN_AUDIENCE;
  }
  async getToken() {
    // naive implementation, does not check for expired tokens
    if (this.cachedToken) {
      return this.cachedToken;
    }
    const tokenResponse = (
      await this.authenticationClient.oauth.clientCredentialsGrant({
        audience: this.audience
      })
    ).data;
    this.cachedToken = tokenResponse.access_token;
    return this.cachedToken;
  }
  async request(path, options) {
    const baseOptions = {
      resolveBodyOnly: true,
      responseType: "json",
      prefixUrl: this.baseUrl,
      headers: { Authorization: `Bearer ${await this.getToken()}` }
    };
    const resolvedOptions = {
      ...baseOptions,
      ...options
    };
    return got(path, resolvedOptions);
  }
  async getConfiguration() {
    return await this.request("configuration/export");
  }
  async removeGroupMembers(groupId, members) {
    return await this.request(`groups/${groupId}/members`, {
      method: "delete",
      json: members
    });
  }
}
