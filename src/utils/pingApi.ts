import { API_URL } from "@/constants/config";

export const getHealthCheckUrl = (apiUrl: string = API_URL) => {
  const base = apiUrl.replace(/\/api\/?$/, "");
  return `${base}/health`;
};

export type ApiPingResult = {
  ok: boolean;
  url: string;
  detail: string;
};

/** Same network path as login (React Native fetch, not the phone browser). */
export const pingApiHealth = async (
  apiUrl: string = API_URL,
): Promise<ApiPingResult> => {
  const url = getHealthCheckUrl(apiUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });
    const body = (await response.text()).slice(0, 120);
    return {
      ok: response.ok,
      url,
      detail: response.ok ? body : `HTTP ${response.status}: ${body}`,
    };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Request failed";
    return { ok: false, url, detail };
  } finally {
    clearTimeout(timer);
  }
};
