// backend/routes/events.js - versión simplificada
const express = require('express');
const router = express.Router();

// Ruta para obtener todos los eventos
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Lista de eventos (función simulada)',
    data: []
  });
});

// Ruta para crear un nuevo evento
router.post('/', (req, res) => {
  res.status(201).json({
    success: true,
    message: 'Evento creado (función simulada)',
    data: { ...req.body, _id: 'event_' + Date.now() }
  });
});

// Ruta para obtener un evento específico
router.get('/:id', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Detalles de evento (función simulada)',
    data: { _id: req.params.id, title: 'Evento de ejemplo', description: 'Descripción de ejemplo' }
  });
});

module.exports = router;