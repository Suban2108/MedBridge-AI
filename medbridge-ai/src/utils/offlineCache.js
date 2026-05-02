const DB_NAME = 'medbridge-cache-db';
const STORE_NAME = 'responses';
const DB_VERSION = 1;

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const hashBuffer = async (buffer) => {
  // Check if crypto.subtle is available (only in secure contexts)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } else {
    // Fallback: simple hash for non-secure contexts
    let hash = 0;
    const view = new Uint8Array(buffer);
    for (let i = 0; i < view.length; i++) {
      hash = ((hash << 5) - hash + view[i]) & 0xffffffff;
    }
    return Math.abs(hash).toString(16);
  }
};

const hashBlob = async (blob) => {
  try {
    const buffer = await blob.arrayBuffer();
    return hashBuffer(buffer);
  } catch (error) {
    // If arrayBuffer fails, use metadata-based hash
    return `${blob.name || 'unnamed'}_${blob.size}_${blob.type}`;
  }
};

const stableStringify = (value) => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
};

const serializeFormData = async (formData) => {
  const entries = [];
  for (const [key, value] of formData.entries()) {
    if (value instanceof File || value instanceof Blob) {
      // Use file metadata for hashing instead of content
      const fileKey = `${key}:${value.name || 'unnamed'}:${value.size}:${value.type || ''}:${value.lastModified || 0}`;
      entries.push([key, { type: 'file', key: fileKey }]);
    } else {
      entries.push([key, { type: 'value', value: String(value) }]);
    }
  }

  entries.sort(([a], [b]) => a.localeCompare(b));
  return stableStringify(entries);
};

const getCacheKey = async (url, body) => {
  let serialized;

  if (body instanceof FormData) {
    serialized = await serializeFormData(body);
  } else if (typeof body === 'string') {
    serialized = body;
  } else {
    serialized = stableStringify(body);
  }

  return `${url}::${serialized}`;
};

const cachePut = async (key, value) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ value, timestamp: Date.now() }, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const cacheGet = async (key) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result?.value ?? null);
    request.onerror = () => reject(request.error);
  });
};

const buildFallbackResponse = (cachedData) => {
  return {
    ok: true,
    status: 200,
    json: async () => cachedData,
    fromCache: true,
  };
};

export const cachedJsonPost = async (url, body, options = {}) => {
  const cacheKey = await getCacheKey(url, body);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: JSON.stringify(body),
      ...options,
    });

    const data = await response.json();

    if (response.ok) {
      await cachePut(cacheKey, data);
      return { ok: true, status: response.status, json: async () => data, fromCache: false };
    }

    const cached = await cacheGet(cacheKey);
    if (cached !== null) {
      return buildFallbackResponse(cached);
    }

    return { ok: false, status: response.status, json: async () => data, fromCache: false };
  } catch (error) {
    const cached = await cacheGet(cacheKey);
    if (cached !== null) {
      return buildFallbackResponse(cached);
    }
    throw error;
  }
};

export const cachedFormPost = async (url, formData, options = {}) => {
  const cacheKey = await getCacheKey(url, formData);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      ...options,
    });

    const data = await response.json();

    if (response.ok) {
      await cachePut(cacheKey, data);
      return { ok: true, status: response.status, json: async () => data, fromCache: false };
    }

    const cached = await cacheGet(cacheKey);
    if (cached !== null) {
      return buildFallbackResponse(cached);
    }

    return { ok: false, status: response.status, json: async () => data, fromCache: false };
  } catch (error) {
    const cached = await cacheGet(cacheKey);
    if (cached !== null) {
      return buildFallbackResponse(cached);
    }
    throw error;
  }
};
