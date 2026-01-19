import crypto from 'crypto';

export const generateInvitationToken = () => crypto.randomBytes(32).toString('hex');

export const generatePIN = () => String(Math.floor(100000 + Math.random() * 900000));

export const getExpirationDate = () => {
  const minutes = Number(process.env.FAMILY_INVITE_EXPIRY_MINUTES || 4);
  return new Date(Date.now() + minutes * 60 * 1000);
};

export const isExpired = (expiresAt) => new Date() > new Date(expiresAt);
