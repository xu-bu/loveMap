export async function getUserIP() {
  const res = await fetch("https://api.ipify.org?format=json");
  const data = await res.json();

  return data.ip; // user's public IP
}