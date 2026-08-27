/**
 * Server-Sent Events (SSE) Hub for Real-Time Trip Updates
 * Enables 0-latency live balance sync across multiple devices without polling.
 */

// Map of tripId -> Set of response streams
const tripClients = new Map();

/**
 * Registers an active client connection for real-time trip notifications.
 */
export const registerTripClient = (tripId, res) => {
  const tid = tripId.toString();
  if (!tripClients.has(tid)) {
    tripClients.set(tid, new Set());
  }
  
  const clients = tripClients.get(tid);
  clients.add(res);

  // Send initial connection handshake
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', tripId: tid, timestamp: Date.now() })}\n\n`);

  // Clean up on client disconnect
  res.on('close', () => {
    clients.delete(res);
    if (clients.size === 0) {
      tripClients.delete(tid);
    }
  });
};

/**
 * Broadcasts an event to all active clients viewing a specific trip.
 */
export const broadcastTripEvent = (tripId, eventType, payload = {}) => {
  const tid = tripId.toString();
  const clients = tripClients.get(tid);

  if (clients && clients.size > 0) {
    const data = JSON.stringify({
      type: eventType,
      tripId: tid,
      payload,
      timestamp: Date.now(),
    });

    clients.forEach((client) => {
      try {
        client.write(`data: ${data}\n\n`);
      } catch (err) {
        console.error('SSE client write error:', err.message);
        clients.delete(client);
      }
    });
  }
};
