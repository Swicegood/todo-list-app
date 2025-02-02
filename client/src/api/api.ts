import axios, { AxiosRequestConfig, AxiosError } from 'axios';

const backendURL = 'http://localhost:3000';
const api = axios.create({
  baseURL: backendURL,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: (status) => {
    return status >= 200 && status < 300;
  },
});

// Remove caching of accessToken and always read from localStorage
api.interceptors.request.use(
  (config: AxiosRequestConfig): AxiosRequestConfig => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Request interceptor - Initial token analysis:', {
        accessTokenSize: token?.length,
        url: config.url,
        method: config.method
      });

      if (token) {
        try {
          // Decode and analyze token parts
          const parts = token.split('.');
          console.log('Token structure analysis:', {
            numberOfParts: parts.length,
            parts: parts.map((part, i) => ({
              partIndex: i,
              partSize: part.length,
              // Only try to decode if it looks like base64
              sample: part.slice(0, 20) + '...',
              decodedSize: part ? atob(part.replace(/-/g, '+').replace(/_/g, '/')).length : 0
            }))
          });

          // Try to decode the payload (middle part)
          if (parts[1]) {
            const decodedPayload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            console.log('Decoded token payload:', {
              payloadKeys: Object.keys(decodedPayload),
              payloadSize: JSON.stringify(decodedPayload).length,
              payload: decodedPayload
            });
          }
        } catch (decodeError) {
          console.error('Error analyzing token:', {
            error: decodeError,
            tokenStart: token.slice(0, 50) + '...',
            tokenLength: token.length
          });
        }
      }

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Final request headers:', {
          authHeaderSize: config.headers.Authorization.length,
          totalHeadersSize: JSON.stringify(config.headers).length
        });
      }
      return config;
    } catch (error) {
      console.error('Critical error in request interceptor:', error);
      return config;
    }
  },
  (error: AxiosError): Promise<AxiosError> => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Axios response interceptor: Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError): Promise<any> => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if ([401, 403].includes(error.response?.status) && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        console.log('Refresh attempt - Token sizes:', {
          refreshTokenSize: refreshToken?.length,
          refreshTokenParts: refreshToken?.split('.').map(part => ({
            part: part.slice(0, 10) + '...',
            size: part.length
          }))
        });

        const { data } = await axios.post<{ accessToken: string }>(`${backendURL}/api/auth/refresh`, {
          refreshToken
        });

        console.log('Refresh response - New token sizes:', {
          newAccessTokenSize: data.accessToken?.length
        });

        localStorage.setItem('accessToken', data.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return api(originalRequest);
      } catch (err) {
        console.error('Refresh token error:', {
          error: err,
          storedRefreshTokenSize: localStorage.getItem('refreshToken')?.length
        });
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;