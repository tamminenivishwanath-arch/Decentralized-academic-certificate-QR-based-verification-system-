import axios, { AxiosError } from 'axios';

// API instance configured for Flask backend
const api = axios.create({
  baseURL: 'http://127.0.0.1:5000',
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response type definitions
export interface LoginResponse {
  message?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface IssueCertificateResponse {
  certHash: string;
  txHash?: string;
  blockNumber?: number;
  message?: string;
}

export interface VerifyCertificateResponse {
  valid: boolean;
  message?: string;
  certificate?: {
    studentName: string;
    course: string;
    institution: string;
    issueDate: string;
  };
}

export interface HealthResponse {
  status: string;
  connected?: boolean;
  contract?: boolean;
  block?: number;
}

// Error handler helper
function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    const message = 
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      'An unexpected error occurred';
    throw new Error(message);
  }
  throw error;
}

// Normalize certHash to always have 0x prefix and 64 hex chars
function normalizeCertHash(hash: string | undefined): string {
  if (!hash) return '';
  const cleaned = hash.toLowerCase().replace(/^0x/, '');
  return `0x${cleaned}`;
}

/**
 * Login to the system
 */
export async function login(body: { username?: string; email?: string; password: string }): Promise<LoginResponse> {
  try {
    const response = await api.post<LoginResponse>('/login', body);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Issue a new certificate
 */
export async function issueCertificate(body: {
  studentName: string;
  course: string;
  institution: string;
  issueDate: string;
}): Promise<IssueCertificateResponse> {
  try {
    const response = await api.post<IssueCertificateResponse>('/issue', body);
    // Normalize the certHash in response
    return {
      ...response.data,
      certHash: normalizeCertHash(response.data.certHash),
    };
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Verify a certificate by hash
 */
export async function verifyCertificate(body: { certHash: string }): Promise<VerifyCertificateResponse> {
  try {
    // Ensure hash is normalized before sending
    const normalizedBody = {
      certHash: normalizeCertHash(body.certHash),
    };
    const response = await api.post<VerifyCertificateResponse>('/verify', normalizedBody);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Check backend health status
 */
export async function healthCheck(): Promise<HealthResponse> {
  try {
    const response = await api.get<HealthResponse>('/health');
    return response.data;
  } catch (error) {
    // Return disconnected status on error instead of throwing
    return {
      status: 'error',
      connected: false,
      contract: false,
    };
  }
}

export default api;
