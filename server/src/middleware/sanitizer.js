const isPlainObject = (val) =>
  Boolean(val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date));

const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (isPlainObject(value)) {
    const clean = {};
    for (const [k, v] of Object.entries(value)) {
      if (!k.startsWith('$') && !k.includes('.')) {
        clean[k] = sanitizeValue(v);
      }
    }
    // If an object had keys originally but all were operators (e.g. { $gt: '' }), drop it
    if (Object.keys(value).length > 0 && Object.keys(clean).length === 0) {
      return undefined;
    }
    return clean;
  }
  return value;
};

export const sanitizeObject = (obj) => {
  if (!isPlainObject(obj)) return obj;
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    const sanitizedVal = sanitizeValue(value);
    if (sanitizedVal !== undefined) {
      clean[key] = sanitizedVal;
    }
  }
  return clean;
};

export const noSqlSanitizer = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
};
