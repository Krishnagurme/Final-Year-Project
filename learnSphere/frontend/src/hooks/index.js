// Custom hooks for the application

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setUser, logout } from '../store/authSlice.js';
import { userService } from '../services/index.js';

export const useAuth = () => {
  const { user, token, isAuthenticated, loading } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isAuthenticated && !user) {
      userService
        .getProfile()
        .then(response => {
          dispatch(setUser(response.data.data));
        })
        .catch(() => {
          dispatch(logout());
        });
    }
  }, [isAuthenticated, user, dispatch]);

  return { user, token, isAuthenticated, loading };
};

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  }, [key, initialValue]);

  const setValue = value => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

export const useDocumentTitle = title => {
  useEffect(() => {
    document.title = title ? `${title} | LearnSphere` : 'LearnSphere';
  }, [title]);
};
