/**
 * Servizio API centralizzato - Tutte le chiamate sono POST
 * Gestisce la comunicazione con il backend Express
 */

import axios from "axios";

// Configurazione base per axios
const api = axios.create({
  baseURL: "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor per logging delle richieste (solo in dev)
if (process.env.NODE_ENV === "development") {
  api.interceptors.request.use((config) => {
    console.log(
      `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
      config.data
    );
    return config;
  });

  api.interceptors.response.use(
    (response) => {
      console.log(`✅ API Response: ${response.status}`, response.data);
      return response;
    },
    (error) => {
      console.error(`❌ API Error:`, error.response?.data || error.message);
      return Promise.reject(error);
    }
  );
}

/**
 * Template API endpoints
 */
export const templateApi = {
  // Lista tutti i template
  list: () => api.post("/template/list"),

  // Crea un nuovo template
  create: (data) => api.post("/template/create", data),

  // Aggiorna un template esistente
  update: (data) => api.post("/template/update", data),

  // Elimina un template
  delete: (data) => api.post("/template/delete", data),

  // Analizza file .env multipli per l'importazione
  analyzeImport: (data) => api.post("/template/analyze-import", data),

  // Conferma l'importazione e crea template + clients + variables
  confirmImport: (data) => api.post("/template/confirm-import", data),
};

/**
 * Client API endpoints
 */
export const clientApi = {
  // Lista tutti i clienti di un template
  list: (data) => api.post("/client/list", data),

  // Crea un nuovo cliente
  create: (data) => api.post("/client/create", data),

  // Aggiorna un cliente esistente
  update: (data) => api.post("/client/update", data),

  // Elimina un cliente
  delete: (data) => api.post("/client/delete", data),
};

/**
 * Variable API endpoints
 */
export const variableApi = {
  // Lista tutte le variabili di un cliente
  list: (data) => api.post("/variable/list", data),

  // Crea una nuova variabile
  create: (data) => api.post("/variable/create", data),

  // Aggiorna una variabile esistente
  update: (data) => api.post("/variable/update", data),

  // Elimina una variabile
  delete: (data) => api.post("/variable/delete", data),
};

/**
 * Environment generation API endpoints
 */
export const envApi = {
  // Genera un singolo file .env
  generate: (data) => api.post("/generate-env", data),

  // Esporta ZIP con tutti i file .env
  exportZip: async (data) => {
    const response = await api.post("/export-zip", data, {
      responseType: "blob",
    });
    return response;
  },
};

/**
 * Utility API endpoints
 */
export const utilityApi = {
  // Health check del server
  health: () => api.post("/health"),
};

/**
 * Helper per scaricare file blob
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Helper per copiare testo negli appunti
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback per browser non compatibili
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    return true;
  }
};

export default api;
