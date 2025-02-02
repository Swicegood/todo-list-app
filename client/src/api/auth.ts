import api from './api';

// Description: Login user functionality
// Endpoint: POST /api/auth/login
// Request: { email: string, password: string }
// Response: { accessToken: string, refreshToken: string }
export const login = async (email: string, password: string) => {
  try {
    console.log('Making login API call with email:', email);
    const response = await api.post('/api/auth/login', { email, password });
    
    console.log('Login API response - Token sizes:', {
      accessTokenSize: response.data.accessToken?.length,
      refreshTokenSize: response.data.refreshToken?.length,
      accessTokenParts: response.data.accessToken?.split('.').map((part, index) => ({
        part: part.slice(0, 10) + '...',
        size: part.length,
        decoded:
          index < 2
            ? JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))
            : 'signature not parsed'
      })),
      refreshTokenParts: response.data.refreshToken?.split('.').map((part, index) => ({
        part: part.slice(0, 10) + '...',
        size: part.length,
        decoded:
          index < 2
            ? JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))
            : 'signature not parsed'
      }))
    });
    
    // Expect { user: { _id, email }, accessToken, refreshToken }
    const { user, accessToken, refreshToken } = response.data;

    // Store only the token strings in localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Optionally store user data separately if you need it
    localStorage.setItem('user', JSON.stringify(user));

    return response.data;
  } catch (error: any) {
    console.error('Login API error:', error?.response?.data);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Register user functionality
// Endpoint: POST /api/auth/register
// Request: { email: string, password: string }
// Response: { email: string }
export const register = async (email: string, password: string) => {
  try {
    console.log('Making register API call with email:', email);
    const response = await api.post('/api/auth/register', {email, password});
    console.log('Register API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Register API error:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Logout
// Endpoint: POST /api/auth/logout
// Request: {}
// Response: { success: boolean, message: string }
export const logout = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (token) {
      await api.post('/api/auth/logout');
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.clear();
  }
};
