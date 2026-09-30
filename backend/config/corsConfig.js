const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
];

export const corsOptions = {
  origin: (origin, callback) => {
    const isProduction = process.env.NODE_ENV === "production";
    if (!isProduction && !origin) {
      return callback(null, true);
    }

    const isExplicitlyAllowed =
      allowedOrigins.includes(origin) ||
      origin === process.env.FRONTEND_URL ||
      (origin && origin.endsWith(".vercel.app"));

    let isLocalDevOrigin = false;
    if (origin) {
      try {
        const parsed = new URL(origin);
        isLocalDevOrigin =
          (parsed.hostname === "localhost" ||
            parsed.hostname === "127.0.0.1") &&
          ["3000", "5173", "5174"].includes(parsed.port);
      } catch {
        isLocalDevOrigin = false;
      }
    }

    if (!origin || isExplicitlyAllowed || isLocalDevOrigin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  exposedHeaders: ["Content-Disposition"],
};
