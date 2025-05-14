// frontend/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';
import websocketService from '../services/websocketService';

// Crear contexto
const AuthContext = createContext(null);

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Inicializar la autenticación al cargar la aplicación
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Verificar si hay un usuario en localStorage
        const storedUser = authService.getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
          
          // Conectar WebSocket
          await websocketService.connect().catch(console.error);
        }
      } catch (error) {
        console.error('Error al inicializar la autenticación:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initAuth();
  }, []);

  // Función para iniciar sesión
  const login = async (email, password) => {
    try {
      setLoading(true);
      const result = await authService.login(email, password);
      setUser(result.data.user);
      
      // Conectar WebSocket después de iniciar sesión
      await websocketService.connect().catch(console.error);
      
      return { success: true };
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al iniciar sesión'
      };
    } finally {
      setLoading(false);
    }
  };

  // Función para registrarse
  const register = async (userData) => {
    try {
      setLoading(true);
      const result = await authService.register(userData);
      setUser(result.data.user);
      
      // Conectar WebSocket después de registrarse
      await websocketService.connect().catch(console.error);
      
      return { success: true };
    } catch (error) {
      console.error('Error al registrarse:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al registrarse'
      };
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    // Desconectar WebSocket
    websocketService.disconnect();
    
    // Eliminar datos de autenticación
    authService.logout();
    setUser(null);
  };

  // Función para actualizar perfil
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const result = await authService.updateProfile(profileData);
      setUser(result.data);
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al actualizar perfil'
      };
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar si el usuario es administrador
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  // Proporcionar el contexto a los componentes hijos
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        initialized,
        login,
        register,
        logout,
        updateProfile,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;