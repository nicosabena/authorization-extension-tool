import { AuthenticationClient } from "auth0";
import got from "got";

export class AuthorizationExtensionClient {
  authenticationClient;
  cachedToken;
  baseUrl;
  audience;
  constructor(options) {
    this.authenticationClient = new AuthenticationClient({
      domain: options.domain,
      clientId: options.clientId,
      clientSecret: options.clientSecret
    });
    this.baseUrl = options.baseUrl;
    this.audience = options.audience;
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
  async getGroupMembers(groupId) {
    return await this.request(`groups/${groupId}/members`);
  }
  async addGroupMembers(groupId, members) {
    return await this.request(`groups/${groupId}/members`, {
      method: "patch",
      json: members
    });
  }
  async getAllGroups() {
    return await this.request(`groups`);
  }
  async getAllRoles() {
    return await this.request("roles");
  }
}

let defaultClient;
export function getAuthorizationExtensionClient() {
  if (!defaultClient) {
    const {
      TENANT_DOMAIN,
      CLIENT_ID,
      CLIENT_SECRET,
      AUTHORIZATION_EXTENSION_API_TOKEN_AUDIENCE,
      AUTHORIZATION_EXTENSION_API_URL
    } = process.env;
    defaultClient = new AuthorizationExtensionClient({
      domain: TENANT_DOMAIN,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      audience: AUTHORIZATION_EXTENSION_API_TOKEN_AUDIENCE,
      baseUrl: AUTHORIZATION_EXTENSION_API_URL
    });
  }
  return defaultClient;
}
