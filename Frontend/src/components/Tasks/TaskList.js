// frontend/src/components/Tasks/TaskList.js
import React, { useState, useEffect } from 'react';
import taskService from '../../services/taskService';
import websocketService from '../../services/websocketService';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    page: 1,
    limit: 10
  });

  // Cargar tareas al montar el componente
  useEffect(() => {
    loadTasks();
    
    // Configurar listeners de WebSocket
    const createdListener = websocketService.addListener('task:created', handleTaskCreated);
    const updatedListener = websocketService.addListener('task:updated', handleTaskUpdated);
    const deletedListener = websocketService.addListener('task:deleted', handleTaskDeleted);
    
    // Limpiar listeners al desmontar
    return () => {
      websocketService.removeListener('task:created', createdListener);
      websocketService.removeListener('task:updated', updatedListener);
      websocketService.removeListener('task:deleted', deletedListener);
    };
  }, []);

  // Cargar tareas cuando cambian los filtros
  useEffect(() => {
    loadTasks();
  }, [filters]);

  // Cargar tareas desde la API
  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await taskService.getTasks(filters);
      
      if (result.success) {
        setTasks(result.data);
        setPagination(result.pagination);
      } else {
        setError(result.message || 'Error al cargar tareas');
      }
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      setError('Error al cargar tareas. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Manejadores de eventos WebSocket
  const handleTaskCreated = (task) => {
    setTasks((prev) => [task, ...prev]);
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) => prev.map(task => 
      task._id === updatedTask._id ? updatedTask : task
    ));
    
    // Si es la tarea que estamos editando, actualizar
    if (editingTask && editingTask._id === updatedTask._id) {
      setEditingTask(updatedTask);
    }
  };

  const handleTaskDeleted = ({ taskId }) => {
    setTasks((prev) => prev.filter(task => task._id !== taskId));
    
    // Si es la tarea que estamos editando, cancelar edición
    if (editingTask && editingTask._id === taskId) {
      setEditingTask(null);
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
    loadTasks();
  };

  // Manejar cambio de página
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Manejar edición de tarea
  const handleEditTask = (task) => {
    setEditingTask(task);
    // Hacer scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Manejar eliminación de tarea
  const handleDeleteTask = async (taskId) => {
    try {
      const confirmed = window.confirm('¿Estás seguro de eliminar esta tarea?');
      
      if (!confirmed) return;
      
      const result = await taskService.deleteTask(taskId);
      
      if (!result.success) {
        setError(result.message || 'Error al eliminar la tarea');
        return;
      }
      
      // La eliminación se reflejará automáticamente a través de WebSockets
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      setError('Error al eliminar la tarea. Por favor intenta nuevamente.');
    }
  };

  // Manejar tarea agregada o actualizada desde el formulario
  const handleTaskAddedOrUpdated = (task) => {
    if (editingTask) {
      // Actualizar la tarea en la lista
      setTasks(prev => 
        prev.map(t => t._id === task._id ? task : t)
      );
      setEditingTask(null);
    } else {
      // Agregar nueva tarea a la lista
      setTasks(prev => [task, ...prev]);
    }
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  return (
    <div className="task-list-container">
      <div className="form-container">
        <TaskForm 
          onTaskAdded={handleTaskAddedOrUpdated} 
          editTask={editingTask}
          onCancelEdit={handleCancelEdit}
        />
      </div>
      
      <div className="filters-container">
        <h2>Mis tareas</h2>
        
        <form onSubmit={handleSearch} className="search-form">
          <div className="filter-group">
            <input
              type="text"
              name="search"
              placeholder="Buscar tareas..."
              value={filters.search}
              onChange={handleFilterChange}
              className="search-input"
            />
            <button type="submit" className="search-button">Buscar</button>
          </div>
          
          <div className="filter-group">
            <label htmlFor="status-filter">Estado:</label>
            <select
              id="status-filter"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="status-filter"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="en progreso">En progreso</option>
              <option value="completada">Completada</option>
            </select>
          </div>
        </form>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="tasks-wrapper">
        {loading ? (
          <div className="loading">Cargando tareas...</div>
        ) : tasks.length === 0 ? (
          <div className="no-tasks">
            <p>No hay tareas disponibles. ¿Por qué no creas una?</p>
          </div>
        ) : (
          <ul id="lista-tareas">
            {tasks.map(task => (
              <TaskItem
                key={task._id}
                task={task}
                onEdit={() => handleEditTask(task)}
                onDelete={() => handleDeleteTask(task._id)}
              />
            ))}
          </ul>
        )}
      </div>
      
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
  );
};

export default TaskList;