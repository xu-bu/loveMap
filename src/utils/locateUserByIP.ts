import { getUserIP } from "./getIP";

export async function locateUserByIP() {
  const VITE_GAODE_WEB_SERVICE_API_KEY = import.meta.env
    .VITE_GAODE_WEB_SERVICE_API_KEY;
  const ip = getUserIP();
  const url = `https://restapi.amap.com/v5/ip/location?key=${VITE_GAODE_WEB_SERVICE_API_KEY}&ip=${ip}&type=4`;
  const res: any = await fetch(url);

  return res.location;
}
