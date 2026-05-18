import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1/cart';

export const fetchCart = async () => {
  const response = await axios.get(API_BASE_URL);
  return response.data;
};

export const addToCart = async (productId, quantity = 1) => {
  const response = await axios.post(API_BASE_URL + '/add', {
    product_id: productId,
    quantity,
  });
  return response.data;
};

export const updateCartItem = async (productId, newQuantity) => {
  const response = await axios.put(API_BASE_URL + '/update', {
    product_id: productId,
    new_quantity: newQuantity,
  });
  return response.data.cart;
};

export const removeCartItem = async (productId) => {
  const response = await axios.delete(API_BASE_URL + '/remove', {
    data: { product_id: productId },
  });
  return response.data.cart;
};
