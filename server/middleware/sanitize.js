// Strips keys that could be interpreted as MongoDB operators ("$gt") or dotted paths ("a.b")
// from req.body / req.params / req.query, which blocks NoSQL operator injection.
export function stripMongoOperators(obj) {
  if (!obj || typeof obj !== "object") return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) delete obj[key];
    else stripMongoOperators(obj[key]);
  }
  return obj;
}

export default function sanitize(req, res, next) {
  stripMongoOperators(req.body);
  stripMongoOperators(req.params);
  stripMongoOperators(req.query);
  next();
}
