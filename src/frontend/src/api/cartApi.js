import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/cart';

export const fetchCart = async () => {
    const response = await axios.get(API_BASE_URL);
    return response.data;
};

export const addToCart = async (productDetails) => {
    const response = await axios.post(`${API_BASE_URL}/add`, productDetails);
    return response.data;
};
