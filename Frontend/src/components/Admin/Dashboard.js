// frontend/src/components/Admin/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import UserManagement from './UserManagement';
import Statistics from './Statistics';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('statistics');
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Verificar si el usuario es administrador
  if (!user || !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    loadStatistics();
  }, []);

  // Cargar estadísticas desde la API
  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/admin/statistics');
      
      if (response.data.success) {
        setStatistics(response.data.data);
      } else {
        setError(response.data.message || 'Error al cargar estadísticas');
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setError('Error al cargar estadísticas. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de pestaña
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="admin-dashboard">
      <h1>Panel de Administración</h1>
      
      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => handleTabChange('statistics')}
        >
          Estadísticas
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => handleTabChange('users')}
        >
          Gestión de Usuarios
        </button>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="tab-content">
        {activeTab === 'statistics' ? (
          <Statistics 
            statistics={statistics} 
            loading={loading} 
            onRefresh={loadStatistics} 
          />
        ) : (
          <UserManagement />
        )}
      </div>
    </div>
  );
};

export default Dashboard;