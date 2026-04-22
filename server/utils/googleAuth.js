import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (token) => {
  try {
    // Try to verify as ID Token (default flow)
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    return {
      success: true,
      data: {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      }
    };
  } catch (error) {
    // If ID token verification fails, it might be an Access Token from the custom hook
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Invalid access token');
      
      const payload = await response.json();
      return {
        success: true,
        data: {
          googleId: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        }
      };
    } catch (err) {
      console.error('Google token verification error:', err);
      return {
        success: false,
        error: 'Invalid Google token'
      };
    }
  }
};
