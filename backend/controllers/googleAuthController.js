import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import { getJwtSecret } from "../utils/jwtSecret.js";
import { resolveEmployeeForAuthUser } from "../utils/employeeUserLink.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

const getFrontendUrl = (req) => {
  if (process.env.FRONTEND_URL) {
    const url = process.env.FRONTEND_URL.trim().replace(/\/$/, "");
    return url.replace(/^http:\/\/localhost\b/, "http://127.0.0.1");
  }
  if (req) {
    const origin = req.get("origin") || req.get("referer");
    if (origin) {
      try {
        return new URL(origin).origin;
      } catch {
        /* ignore */
      }
    }
    const proto = req.headers?.["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers?.["x-forwarded-host"] || req.get("host");
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      if (host.includes("vercel.app")) {
        const inferred = host.replace("-bn.vercel.app", "-fn.vercel.app");
        return `${proto}://${inferred}`;
      }
      return `${proto}://${host}`;
    }
  }
  return "http://127.0.0.1:5173";
};

const getCallbackUrl = (req) => {
  if (process.env.GOOGLE_CALLBACK_URL) {
    return process.env.GOOGLE_CALLBACK_URL.trim();
  }
  const protocol = req?.headers?.["x-forwarded-proto"] || req?.protocol || "https";
  const host = req?.headers?.["x-forwarded-host"] || req?.get("host");
  return `${protocol}://${host}/api/auth/google/callback`;
};

const signToken = (id) =>
  jwt.sign({ id }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const redirectToLogin = (res, errorCode, req) => {
  res.redirect(`${getFrontendUrl(req)}/login?error=${encodeURIComponent(errorCode)}`);
};

const redirectWithAuthSuccess = (res, user, req) => {
  const token = signToken(user._id);
  const userPayload = encodeURIComponent(
    JSON.stringify({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
  );

  res.redirect(
    `${getFrontendUrl(req)}/auth/google/callback?token=${encodeURIComponent(token)}&user=${userPayload}`
  );
};

const isGoogleConfigured = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());

const useDevGoogleMock = () =>
  process.env.NODE_ENV !== "production" && process.env.GOOGLE_DEV_MOCK !== "false";

const createOAuthState = () =>
  jwt.sign({ purpose: "google_oauth" }, getJwtSecret(), { expiresIn: "10m" });

const verifyOAuthState = (state) => {
  if (!state) {
    return false;
  }
  try {
    const payload = jwt.verify(state, getJwtSecret());
    return payload?.purpose === "google_oauth";
  } catch {
    return false;
  }
};

const exchangeCodeForProfile = async (code, redirectUri) => {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${errText}`);
  }

  const tokenData = await tokenRes.json();
  const profileRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!profileRes.ok) {
    throw new Error("Failed to fetch Google user profile.");
  }

  return profileRes.json();
};

const findOrCreateGoogleUser = async (profile) => {
  const email = (profile.email || "").toLowerCase().trim();
  if (!email) {
    throw new Error("Google account did not return an email address.");
  }

  let user =
    (profile.id ? await User.findOne({ googleId: profile.id }) : null) ||
    (await User.findOne({ email }));

  if (user) {
    if (profile.id && !user.googleId) {
      user.googleId = profile.id;
    }
    if (!user.name && profile.name) {
      user.name = profile.name;
    }
    user.lastLogin = new Date();
    await user.save();
    
    const employee = await resolveEmployeeForAuthUser(user, { createIfMissing: true });
    if (employee && !employee.profilePhoto && profile.picture) {
      employee.profilePhoto = profile.picture;
      await employee.save();
    }
    return user;
  }

  const created = await User.create({
    name: profile.name || email.split("@")[0],
    email,
    googleId: profile.id || `dev-${email}`,
    role: "Employee",
    isVerified: true,
    lastLogin: new Date(),
  });
  
  const employee = await resolveEmployeeForAuthUser(created, { createIfMissing: true });
  if (employee && !employee.profilePhoto && profile.picture) {
    employee.profilePhoto = profile.picture;
    await employee.save();
  }
  return created;
};

const runDevGoogleMock = async (res, req) => {
  const user = await findOrCreateGoogleUser({
    id: "dev-google-mock",
    email: "google.demo@sems.com",
    name: "Google Demo User",
    picture: "https://lh3.googleusercontent.com/a/ACg8ocL3g4n3f458t7g90f1h3j-k=s96-c"
  });
  redirectWithAuthSuccess(res, user, req);
};

/** GET /api/auth/google/status */
export const getGoogleAuthStatus = (_req, res) => {
  res.json({ configured: isGoogleConfigured() });
};

/** GET /api/auth/google */
export const redirectToGoogle = async (req, res) => {
  if (!isGoogleConfigured()) {
    if (useDevGoogleMock()) {
      try {
        return await runDevGoogleMock(res, req);
      } catch (err) {
        console.error("Dev Google mock sign-in failed:", err);
        return redirectToLogin(res, "google_auth_failed", req);
      }
    }
    return res.redirect(`${getFrontendUrl(req)}/login?error=${encodeURIComponent("google_not_configured")}`);
  }

  const state = createOAuthState();
  const redirectUri = getCallbackUrl(req);

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
};

/** GET /api/auth/google/callback */
export const handleGoogleCallback = async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return redirectToLogin(res, "google_denied", req);
  }

  if (!isGoogleConfigured()) {
    if (useDevGoogleMock()) {
      try {
        return await runDevGoogleMock(res, req);
      } catch (err) {
        console.error("Dev Google mock callback failed:", err);
        return redirectToLogin(res, "google_auth_failed", req);
      }
    }
    return res.redirect(`${getFrontendUrl(req)}/login?error=${encodeURIComponent("google_not_configured")}`);
  }

  if (!code || !verifyOAuthState(state)) {
    return redirectToLogin(res, "google_invalid_state", req);
  }

  try {
    const redirectUri = getCallbackUrl(req);
    const profile = await exchangeCodeForProfile(code, redirectUri);
    const user = await findOrCreateGoogleUser(profile);
    redirectWithAuthSuccess(res, user, req);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    redirectToLogin(res, "google_auth_failed", req);
  }
};
