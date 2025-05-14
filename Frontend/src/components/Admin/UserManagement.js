// frontend/src/components/Admin/UserManagement.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 10,
    sort: 'createdAt:desc'
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    page: 1,
    limit: 10
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, [filters]);

  // Cargar usuarios desde la API
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.sort) params.append('sort', filters.sort);
      
      const response = await api.get(`/admin/users?${params.toString()}`);
      
      if (response.data.success) {
        setUsers(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.data.message || 'Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError('Error al cargar usuarios. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reiniciar paginación al cambiar filtros
    }));
  };

  // Manejar búsqueda
  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers();
  };

  // Manejar cambio de página
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Cargar detalles de un usuario
  const loadUserDetails = async (userId) => {
    try {
      setLoadingDetails(true);
      setError('');
      
      const response = await api.get(`/admin/users/${userId}`);
      
      if (response.data.success) {
        setUserDetails(response.data.data);
        setSelectedUser(userId);
      } else {
        setError(response.data.message || 'Error al cargar detalles del usuario');
      }
    } catch (error) {
      console.error('Error al cargar detalles del usuario:', error);
      setError('Error al cargar detalles del usuario. Por favor intenta nuevamente.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Cambiar el rol de un usuario
  const changeUserRole = async (userId, newRole) => {
    try {
      const confirmed = window.confirm(`¿Estás seguro de cambiar el rol del usuario a "${newRole}"?`);
      
      if (!confirmed) return;
      
      const response = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      
      if (response.data.success) {
        // Actualizar la lista de usuarios
        setUsers(prev => prev.map(user => 
          user._id === userId 
            ? { ...user, role: newRole }
            : user
        ));
        
        // Actualizar detalles si el usuario está seleccionado
        if (selectedUser === userId && userDetails) {
          setUserDetails({
            ...userDetails,
            user: {
              ...userDetails.user,
              role: newRole
            }
          });
        }
        
        alert('Rol actualizado exitosamente');
      } else {
        setError(response.data.message || 'Error al cambiar el rol del usuario');
      }
    } catch (error) {
      console.error('Error al cambiar el rol del usuario:', error);
      setError('Error al cambiar el rol del usuario. Por favor intenta nuevamente.');
    }
  };

  // Cambiar el estado de un usuario (activar/desactivar)
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const action = newStatus ? 'activar' : 'desactivar';
      const confirmed = window.confirm(`¿Estás seguro de ${action} esta cuenta de usuario?`);
      
      if (!confirmed) return;
      
      const response = await api.patch(`/admin/users/${userId}/status`, { active: newStatus });
      
      if (response.data.success) {
        // Actualizar la lista de usuarios
        setUsers(prev => prev.map(user => 
          user._id === userId 
            ? { ...user, isActive: newStatus }
            : user
        ));
        
        // Actualizar detalles si el usuario está seleccionado
        if (selectedUser === userId && userDetails) {
          setUserDetails({
            ...userDetails,
            user: {
              ...userDetails.user,
              isActive: newStatus
            }
          });
        }
        
        alert(`Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente`);
      } else {
        setError(response.data.message || `Error al ${action} el usuario`);
      }
    } catch (error) {
      console.error('Error al cambiar el estado del usuario:', error);
      setError('Error al cambiar el estado del usuario. Por favor intenta nuevamente.');
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };

  // Renderizar detalles del usuario
  const renderUserDetails = () => {
    if (!userDetails) return null;
    
    const { user, stats, recentTasks, recentEvents } = userDetails;
    
    return (
      <div className="user-details">
        <h3>Detalles del Usuario</h3>
        
        <div className="user-profile">
          {user.profilePicture && (
            <img
              src={`${process.env.REACT_APP_API_URL}/${user.profilePicture}`}
              alt={`Foto de perfil de ${user.username}`}
              className="profile-image"
            />
          )}
          
          <div className="user-info">
            <p><strong>Usuario:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Rol:</strong> {user.role}</p>
            <p><strong>Estado:</strong> {user.isActive ? 'Activo' : 'Inactivo'}</p>
            <p><strong>Creado:</strong> {formatDate(user.createdAt)}</p>
            <p><strong>Último inicio de sesión:</strong> {formatDate(user.lastLogin)}</p>
          </div>
        </div>
        
        <div className="user-stats">
          <h4>Estadísticas</h4>
          <p><strong>Tareas:</strong> {stats.taskCount}</p>
          <p><strong>Eventos:</strong> {stats.eventCount}</p>
        </div>
        
        {recentTasks.length > 0 && (
          <div className="recent-tasks">
            <h4>Tareas Recientes</h4>
            <ul>
              {recentTasks.map(task => (
                <li key={task._id}>
                  <strong>{task.title}</strong> - {task.status}
                  <br />
                  <small>Vence: {formatDate(task.dueDate)}</small>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {recentEvents.length > 0 && (
          <div className="recent-events">
            <h4>Eventos Recientes</h4>
            <ul>
              {recentEvents.map(event => (
                <li key={event._id}>
                  <strong>{event.title}</strong>
                  <br />
                  <small>{formatDate(event.startDate)} - {formatDate(event.endDate)}</small>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="user-actions">
          <h4>Acciones</h4>
          <div className="action-buttons">
            <div className="role-actions">
              <span>Cambiar rol:</span>
              <button
                onClick={() => changeUserRole(user._id, 'user')}
                className={`role-button ${user.role === 'user' ? 'active' : ''}`}
                disabled={user.role === 'user'}
              >
                Usuario
              </button>
              <button
                onClick={() => changeUserRole(user._id, 'admin')}
                className={`role-button ${user.role === 'admin' ? 'active' : ''}`}
                disabled={user.role === 'admin'}
              >
                Administrador
              </button>
            </div>
            
            <div className="status-actions">
              <span>Estado de cuenta:</span>
              <button
                onClick={() => toggleUserStatus(user._id, user.isActive)}
                className={user.isActive ? 'deactivate-button' : 'activate-button'}
              >
                {user.isActive ? 'Desactivar cuenta' : 'Activar cuenta'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="user-management-container">
      <div className="users-section">
        <div className="users-header">
          <h3>Gestión de Usuarios</h3>
          
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              name="search"
              placeholder="Buscar usuarios..."
              value={filters.search}
              onChange={handleFilterChange}
              className="search-input"
            />
            <button type="submit" className="search-button">Buscar</button>
          </form>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        {loading ? (
          <div className="loading">Cargando usuarios...</div>
        ) : users.length === 0 ? (
          <div className="no-users">
            <p>No se encontraron usuarios.</p>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Creado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr 
                    key={user._id} 
                    className={selectedUser === user._id ? 'selected' : ''}
                    onClick={() => loadUserDetails(user._id)}
                  >
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadUserDetails(user._id);
                        }}
                        className="view-details-button"
                      >
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {pagination.pages > 1 && (
          <div className="pagination-container">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="pagination-button"
            >
              &laquo; Anterior
            </button>
            
            <span className="pagination-info">
              Página {pagination.page} de {pagination.pages}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="pagination-button"
            >
              Siguiente &raquo;
            </button>
          </div>
        )}
      </div>
      
      <div className="details-section">
        {loadingDetails ? (
          <div className="loading">Cargando detalles...</div>
        ) : selectedUser ? (
          renderUserDetails()
        ) : (
          <div className="no-selection">
            <p>Selecciona un usuario para ver sus detalles</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;