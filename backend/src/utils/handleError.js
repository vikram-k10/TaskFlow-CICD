// One place to turn errors into JSON responses, so controllers stay short.
// - Mongoose validation problems (e.g. title too long) -> 400 with a readable message
// - Bad values Mongoose can't convert (e.g. a date that isn't a date) -> 400
// - Anything else -> log it and send a generic 500 (never leak internals to the client)
export function handleError(res, err, fallbackMessage) {
  if (err.name === "ValidationError") {
    const firstError = Object.values(err.errors)[0];
    return res.status(400).json({ error: firstError.message });
  }
  // e.g. an invalid due date
  if (err.name === "CastError") {
    return res.status(400).json({ error: `Invalid value for ${err.path}` });
  }
  console.error(fallbackMessage, err);
  return res.status(500).json({ error: fallbackMessage });
}
