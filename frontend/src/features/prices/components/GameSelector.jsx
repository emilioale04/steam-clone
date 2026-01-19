import React, { useState } from 'react';

// prices/components/GameSelector.jsx
// Usa can_update_price y days_until_update del backend para consistencia
export function GameSelector({ apps, selectedGameId, onSelect }) {
  return (
    <div className="mb-4">
      <label className="block text-white mb-2">Selecciona Aplicación</label>
      <p className="text-xs text-gray-400 mb-2">Solo se muestran aplicaciones aprobadas o publicadas</p>
      <select
        className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-white"
        value={selectedGameId || ''}
        onChange={e => onSelect(e.target.value)}
      >
        <option value="">Selecciona un juego aprobado...</option>
        {apps.map(app => {
          // Usar valores del backend para consistencia (regla 30 días)
          const bloqueado = app.can_update_price === false;
          const diasRestantes = app.days_until_update || 0;

          return (
            <option 
              key={app.id} 
              value={app.id} 
              disabled={bloqueado} 
              className={bloqueado ? 'text-gray-500' : 'text-white'}
            >
              {app.nombre_juego} - ${app.precio_base_usd?.toFixed(2) || '0.00'} USD
              {bloqueado ? ` (🔒 No se puede modificar por: ${diasRestantes} día(s))` : ''}
            </option>
          );
        })}
      </select>
    </div>
  );
}
