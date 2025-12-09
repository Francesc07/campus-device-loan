"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;
const client = (0, jwks_rsa_1.default)({
    jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
});
/**
 * Gets the signing key for a given kid
 */
function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            callback(err, null);
            return;
        }
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
    });
}
/**
 * Validate JWT from Authorization header and optionally enforce permissions.
 */
async function requireAuth(req, context, requiredPermissions = []) {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        context.log("❌ Missing or invalid Authorization header");
        return {
            status: 401,
            jsonBody: { error: "Unauthorized", message: "Missing bearer token" },
        };
    }
    const token = authHeader.substring("Bearer ".length);
    try {
        const decoded = await new Promise((resolve, reject) => {
            jsonwebtoken_1.default.verify(token, getKey, {
                audience: AUTH0_AUDIENCE,
                issuer: `https://${AUTH0_DOMAIN}/`,
                algorithms: ["RS256"],
            }, (err, decodedToken) => {
                if (err || !decodedToken) {
                    reject(err || new Error("Token verification failed"));
                }
                else {
                    resolve(decodedToken);
                }
            });
        });
        // Check permissions (Auth0 RBAC)
        if (requiredPermissions.length > 0) {
            const perms = decoded.permissions || [];
            const missing = requiredPermissions.filter((p) => !perms.includes(p));
            if (missing.length > 0) {
                context.log("❌ Missing required permissions:", missing);
                return {
                    status: 403,
                    jsonBody: { error: "Forbidden", message: "Insufficient permissions" },
                };
            }
        }
        return decoded;
    }
    catch (err) {
        context.log("❌ Token verification error:", err.message || err);
        return {
            status: 401,
            jsonBody: { error: "Unauthorized", message: "Invalid token" },
        };
    }
}
//# sourceMappingURL=auth0Validation.js.map