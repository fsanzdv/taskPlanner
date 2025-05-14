// backend/services/weatherService.js
const axios = require('axios');
const { createError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Servicio de clima - Encapsula la interacción con la API del clima
 * Principio de responsabilidad única (S de SOLID)
 */
class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.cacheData = new Map(); // Cache simple en memoria
    this.cacheTTL = 3600000; // 1 hora en milisegundos
  }
  
  /**
   * Obtiene el pronóstico del clima para una ciudad y fecha
   * @param {String} city - Nombre de la ciudad
   * @param {Date|String} date - Fecha para la cual se requiere el pronóstico
   * @returns {Object} - Datos del pronóstico
   */
  async getForecast(city, date) {
    try {
      // Normalizar fecha
      const targetDate = new Date(date);
      const formattedDate = targetDate.toISOString().split('T')[0];
      
      // Verificar caché
      const cacheKey = `${city.toLowerCase()}_${formattedDate}`;
      const cachedData = this.getCachedData(cacheKey);
      
      if (cachedData) {
        logger.info(`Usando datos del clima en caché para ${city} en ${formattedDate}`);
        return cachedData;
      }
      
      // Realizar petición a la API
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          q: city,
          appid: this.apiKey,
          units: 'metric',
          lang: 'es'
        }
      });
      
      // Buscar pronóstico para la fecha específica
      const forecastList = response.data.list || [];
      
      // La API devuelve pronósticos cada 3 horas, necesitamos encontrar el más cercano a la fecha objetivo
      const targetUnix = targetDate.getTime() / 1000; // Convertir a timestamp Unix
      let closestForecast = null;
      let minDiff = Infinity;
      
      for (const forecast of forecastList) {
        const diff = Math.abs(forecast.dt - targetUnix);
        if (diff < minDiff) {
          minDiff = diff;
          closestForecast = forecast;
        }
      }
      
      // Si no se encuentra pronóstico para la fecha específica
      if (!closestForecast) {
        throw createError(404, 'No se encontró pronóstico para la fecha especificada');
      }
      
      // Formato de respuesta
      const weatherData = {
        description: closestForecast.weather[0].description,
        temperature: closestForecast.main.temp,
        icon: closestForecast.weather[0].icon,
        humidity: closestForecast.main.humidity,
        windSpeed: closestForecast.wind.speed,
        date: new Date(closestForecast.dt * 1000).toISOString(),
        city: response.data.city.name,
        country: response.data.city.country
      };
      
      // Guardar en caché
      this.setCachedData(cacheKey, weatherData);
      
      return weatherData;
    } catch (error) {
      logger.error(`Error al obtener pronóstico del clima: ${error.message}`);
      
      if (error.response && error.response.status === 404) {
        throw createError(404, 'Ciudad no encontrada');
      }
      
      throw createError(500, 'Error al obtener datos del clima');
    }
  }
  
  /**
   * Obtiene datos de caché
   * @param {String} key - Clave de caché
   * @returns {Object|null} - Datos en caché o null si no existe o expiró
   */
  getCachedData(key) {
    if (!this.cacheData.has(key)) return null;
    
    const { data, timestamp } = this.cacheData.get(key);
    const now = Date.now();
    
    // Verificar si los datos han expirado
    if (now - timestamp > this.cacheTTL) {
      this.cacheData.delete(key);
      return null;
    }
    
    return data;
  }
  
  /**
   * Guarda datos en caché
   * @param {String} key - Clave de caché
   * @param {Object} data - Datos a almacenar
   */
  setCachedData(key, data) {
    this.cacheData.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Limitar tamaño del caché (evitar fugas de memoria)
    if (this.cacheData.size > 100) {
      // Eliminar entrada más antigua
      const firstKey = this.cacheData.keys().next().value;
      this.cacheData.delete(firstKey);
    }
  }
}

module.exports = new WeatherService();