export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    resetTokenExpiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || '1h',
  },

  email: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM || 'onboarding@resend.dev',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
});
