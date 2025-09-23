export function log(...message) {
  if (Array.isArray(message)) {
    for (const each of message) {
      console.log(`[LOG]: ${JSON.stringify(each)}`);
    }
  } else {
    console.log(`[LOG]: ${JSON.stringify(message)}`);
  }
}
