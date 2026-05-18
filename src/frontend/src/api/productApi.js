// Product catalog HTTP client — routes through the shared axios client
// so VITE_PYTHON_API_BASE controls the host and the JWT interceptor is
// available on the same instance.

import { client } from './client';

export const fetchProducts = async () => {
  const response = await client.get('/products');
  return response.data;
};

export const fetchProductById = async (id) => {
  const response = await client.get(`/products/${id}`);
  return response.data;
};
