export const sseClients = new Map(); // clientId → { res, role, userId }

export function broadcastSSE(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [id, client] of sseClients) {
    try {
      client.res.write(payload);
    } catch {
      sseClients.delete(id);
    }
  }
}

export function broadcastSSEToUser(userId, event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [id, client] of sseClients) {
    if (client.userId && String(client.userId) === String(userId)) {
      try {
        client.res.write(payload);
      } catch {
        sseClients.delete(id);
      }
    }
  }
}
