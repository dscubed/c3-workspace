export const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Request failed");
  return body.data as T;
};
