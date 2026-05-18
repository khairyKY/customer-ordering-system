// Cart HTTP client — routes through the shared axios client so requests
// pick up VITE_PYTHON_API_BASE and the JWT interceptor automatically.

import { client } from './client';

export const fetchCart = async () => {
  const response = await client.get('/cart');
  return response.data;
};

export const addToCart = async (productId, quantity = 1) => {
  const response = await client.post('/cart/add', {
    product_id: productId,
    quantity,
  });
  return response.data;
};

export const updateCartItem = async (productId, newQuantity) => {
  const response = await client.put('/cart/update', {
    product_id: productId,
    new_quantity: newQuantity,
  });
  return response.data.cart;
};

export const removeCartItem = async (productId) => {
  const response = await client.delete('/cart/remove', {
    data: { product_id: productId },
  });
  return response.data.cart;
};
