// frontend/src/components/Tasks/TaskForm.js
import React, { useState, useEffect } from 'react';
import taskService from '../../services/taskService';
import { format } from 'date-fns';

const TaskForm = ({ onTaskAdded, editTask = null, onCancelEdit = null }) => {
  const initialFormState = {
    title: '',
    description: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'pendiente',
    city: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Si se pasa una tarea para editar, cargar sus datos
  useEffect(() => {
    if (editTask) {
      setIsEditing(true);
      setFormData({
        title: editTask.title,
        description: editTask.description,
        dueDate: format(new Date(editTask.dueDate), 'yyyy-MM-dd'),
        status: editTask.status,
        city: editTask.city
      });
    } else {
      setIsEditing(false);
      setFormData(initialFormState);
    }
  }, [editTask]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      const { title, description, dueDate, status, city } = formData;
      
      // Validar formulario
      if (!title || !description || !dueDate || !city) {
        setError('Por favor completa todos los campos requeridos');
        return;
      }
      
      // Crear o actualizar tarea
      let result;
      
      if (isEditing) {
        result = await taskService.updateTask(editTask._id, formData);
      } else {
        result = await taskService.createTask(formData);
      }
      
      if (!result.success) {
        setError(result.message || 'Error al procesar la tarea');
        return;
      }
      
      // Notificar que se agregó/editó la tarea
      onTaskAdded(result.data);
      
      // Reiniciar formulario solo si es una nueva tarea
      if (!isEditing) {
        setFormData(initialFormState);
      } else if (onCancelEdit) {
        onCancelEdit();
      }
      
    } catch (error) {
      console.error('Error al procesar la tarea:', error);
      setError('Error al procesar la tarea. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Cancelar edición
  const handleCancel = () => {
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  return (
    <div className="task-form-container">
      <form className="form" onSubmit={handleSubmit}>
        <h2>{isEditing ? 'Editar tarea' : 'Nueva tarea'}</h2>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <div className="centrado">
          <label htmlFor="title">Título</label>
          <input
            type="text"
            id="title"
            name="title"
            className="text"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="centrado">
          <label htmlFor="description">Descripción</label>
          <textarea
            id="description"
            name="description"
            className="text"
            value={formData.description}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        
        <div className="centrado">
          <label htmlFor="dueDate">Fecha de vencimiento</label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            className="text"
            value={formData.dueDate}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="centrado">
          <label htmlFor="city">Ciudad</label>
          <input
            type="text"
            id="city"
            name="city"
            className="text"
            value={formData.city}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="centrado">
          <label htmlFor="status">Estado</label>
          <select
            id="status"
            name="status"
            className="text"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="pendiente">Pendiente</option>
            <option value="en progreso">En progreso</option>
            <option value="completada">Completada</option>
          </select>
        </div>
        
        <div className="buttons-container">
          <button
            type="submit"
            className="submit"
            disabled={loading}
          >
            {loading ? (isEditing ? 'Actualizando...' : 'Agregando...') : (isEditing ? 'Actualizar' : 'Agregar')}
          </button>
          
          {isEditing && (
            <button
              type="button"
              className="cancel-btn"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TaskForm;