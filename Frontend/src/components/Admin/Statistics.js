// frontend/src/components/Admin/Statistics.js
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Statistics = ({ statistics, loading, onRefresh }) => {
  // Si está cargando, mostrar indicador
  if (loading) {
    return <div className="loading">Cargando estadísticas...</div>;
  }

  // Si no hay estadísticas, mostrar mensaje
  if (!statistics) {
    return (
      <div className="statistics-container">
        <p>No hay estadísticas disponibles</p>
        <button onClick={onRefresh} className="refresh-button">
          Actualizar
        </button>
      </div>
    );
  }

  const { totals, tasksByStatus, userGrowth, taskGrowth } = statistics;

  // Transformar datos para la gráfica de tareas por estado
  const taskStatusData = tasksByStatus.map(item => ({
    name: item._id,
    value: item.count
  }));

  // Combinar datos de usuario y tareas para la gráfica de crecimiento
  const growthData = [];
  
  // Crear un mapa de fechas para facilitar la búsqueda
  const userGrowthMap = new Map();
  userGrowth.forEach(item => {
    userGrowthMap.set(item.date, item.count);
  });
  
  const taskGrowthMap = new Map();
  taskGrowth.forEach(item => {
    taskGrowthMap.set(item.date, item.count);
  });
  
  // Obtener todas las fechas únicas
  const allDates = [...new Set([...userGrowthMap.keys(), ...taskGrowthMap.keys()])].sort();
  
  // Crear datos combinados
  allDates.forEach(date => {
    growthData.push({
      date,
      usuarios: userGrowthMap.get(date) || 0,
      tareas: taskGrowthMap.get(date) || 0
    });
  });

  return (
    <div className="statistics-container">
      <div className="statistics-header">
        <h2>Estadísticas del Sistema</h2>
        <button onClick={onRefresh} className="refresh-button">
          Actualizar
        </button>
      </div>
      
      <div className="statistics-summary">
        <div className="stat-card">
          <h3>Usuarios</h3>
          <div className="stat-value">{totals.users}</div>
        </div>
        <div className="stat-card">
          <h3>Tareas</h3>
          <div className="stat-value">{totals.tasks}</div>
        </div>
        <div className="stat-card">
          <h3>Eventos</h3>
          <div className="stat-value">{totals.events}</div>
        </div>
      </div>
      
      <div className="statistics-charts">
        <div className="chart-container">
          <h3>Tareas por Estado</h3>
          <div className="task-status-chart">
            <table className="status-table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {taskStatusData.map(item => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="chart-container">
          <h3>Crecimiento (Últimos 30 días)</h3>
          <div className="growth-chart">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={growthData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="usuarios" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                  name="Nuevos Usuarios"
                />
                <Line 
                  type="monotone" 
                  dataKey="tareas" 
                  stroke="#82ca9d" 
                  name="Nuevas Tareas"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;