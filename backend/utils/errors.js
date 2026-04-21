/**
 * Short, safe message for API clients — full error stays in server logs.
 * @param {unknown} err
 * @returns {string}
 */
function userFacingChatError(err) {
  const raw = err && typeof err === "object" && "message" in err ? String(err.message) : String(err);
  if (/400|Bad Request|INVALID_ARGUMENT|system_instruction/i.test(raw)) {
    return "We couldn't process that request. Try again or shorten your message.";
  }
  if (/429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(raw)) {
    return "Too many requests. Please wait a moment and try again.";
  }
  if (/403|PERMISSION_DENIED|API key|API_KEY_INVALID/i.test(raw)) {
    return "Chat is temporarily unavailable.";
  }
  if (/503|UNAVAILABLE|overloaded|Deadline/i.test(raw)) {
    return "The assistant is busy. Please try again in a moment.";
  }
  return "Something went wrong. Please try again.";
}

module.exports = {
  userFacingChatError,
};
