// Document state — get/set values by dot-notation path

let document = {};
const listeners = new Set();

export function getDocument() {
  return document;
}

export function setDocument(doc) {
  document = doc;
  notify();
}

export function getValue(path) {
  if (!path) return document;
  const parts = path.split(".");
  let current = document;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

export function setValue(path, value) {
  if (!path) {
    document = value;
    notify();
    return;
  }
  const parts = path.split(".");
  let current = document;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];
    if (current[part] == null) {
      // Create intermediate: array if next part is numeric, object otherwise
      current[part] = /^\d+$/.test(nextPart) ? [] : {};
    }
    current = current[part];
  }
  const lastPart = parts[parts.length - 1];
  if (value === undefined) {
    if (Array.isArray(current)) {
      current.splice(Number(lastPart), 1);
    } else {
      delete current[lastPart];
    }
  } else {
    current[lastPart] = value;
  }
  notify();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) {
    try {
      fn(document);
    } catch (e) {
      console.error("State listener error:", e);
    }
  }
}
