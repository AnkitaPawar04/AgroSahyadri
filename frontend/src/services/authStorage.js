// localStorage helper functions

const TOKEN_KEY = 'access_token';
const USER_KEY = 'user';
const FARMER_ID_KEY = 'farmer_id';

export const authStorage = {
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  getToken: () => localStorage.getItem(TOKEN_KEY),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  getUser: () => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  removeUser: () => localStorage.removeItem(USER_KEY),
  
  setFarmerId: (id) => localStorage.setItem(FARMER_ID_KEY, String(id)),
  getFarmerId: () => localStorage.getItem(FARMER_ID_KEY),
  removeFarmerId: () => localStorage.removeItem(FARMER_ID_KEY),
  
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(FARMER_ID_KEY);
  },
  
  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
};

export default authStorage;
