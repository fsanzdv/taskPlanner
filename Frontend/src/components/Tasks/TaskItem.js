// frontend/src/components/Tasks/TaskItem.js
import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import websocketService from '../../services/websocketService';

const TaskItem = ({ task, onEdit, onDelete }) => {
  // Suscribirse a actualizaciones de la tarea cuando el componente se monta
  useEffect(() => {
    websocketService.subscribeToTask(task._id);
    
    // Cancelar suscripción al desmontar
    return () => {
      websocketService.unsubscribeFromTask(task._id);
    };
  }, [task._id]);

  // Función para formatear la fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'PPP', { locale: es });
  };

  // Función para obtener la clase CSS según el estado
  const getStatusClass = (status) => {
    switch (status) {
      case 'completada':
        return 'status-completed';
      case 'en progreso':
        return 'status-in-progress';
      default:
        return 'status-pending';
    }
  };

  // Función para renderizar el icono del clima
  const renderWeatherIcon = () => {
    if (!task.weatherData) return null;
    
    const { icon } = task.weatherData;
    
    if (!icon) return null;
    
    return (
      <img 
        src={`https://openweathermap.org/img/wn/${icon}@2x.png`} 
        alt={task.weatherData.description || 'Clima'} 
        className="weather-icon"
      />
    );
  };

  return (
    <li className={`tarea ${getStatusClass(task.status)}`}>
      <div className="task-header">
        <h3 className="task-title">{task.title}</h3>
        <div className="task-actions">
          <button 
            onClick={onEdit} 
            className="edit-button" 
            title="Editar tarea"
          >
            ✏️
          </button>
          <button 
            onClick={onDelete} 
            className="delete-button" 
            title="Eliminar tarea"
          >
            🗑️
          </button>
        </div>
      </div>
      
      <div className="task-body">
        <div><strong>Descripción:</strong> {task.description}</div>
        <div><strong>Fecha de vencimiento:</strong> {formatDate(task.dueDate)}</div>
        <div><strong>Estado:</strong> <span className={`status ${getStatusClass(task.status)}`}>{task.status}</span></div>
        <div><strong>Ciudad:</strong> {task.city}</div>
        
        {task.weatherData && (
          <div className="weather-data">
            <div className="weather-header">
              <strong>Clima:</strong> 
              {renderWeatherIcon()}
              <span className="weather-description">{task.weatherData.description}</span>
            </div>
            <div className="weather-details">
              <span className="weather-temp">{Math.round(task.weatherData.temperature)}°C</span>
              {task.weatherData.humidity && (
                <span className="weather-humidity">Humedad: {task.weatherData.humidity}%</span>
              )}
              {task.weatherData.windSpeed && (
                <span className="weather-wind">Viento: {task.weatherData.windSpeed} m/s</span>
              )}
            </div>
          </div>
        )}
        
        {task.attachments && task.attachments.length > 0 && (
          <div className="attachments">
            <strong>Archivos adjuntos:</strong>
            <ul className="attachment-list">
              {task.attachments.map(attachment => (
                <li key={attachment._id} className="attachment-item">
                  <a 
                    href={`${process.env.REACT_APP_API_URL}/${attachment.path}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="attachment-link"
                  >
                    {attachment.filename}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </li>
  );
};

export default TaskItem;