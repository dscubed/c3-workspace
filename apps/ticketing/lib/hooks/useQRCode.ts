import useSWR from "swr";
import { fetcher } from "@c3/utils";

interface QRData {
  dataUrl: string;
}

export function useQRCode(registrationId: string, open: boolean) {
  const { data, isLoading, mutate } = useSWR<QRData>(
    open ? `/api/registrations/${registrationId}/qr` : null,
    fetcher,
  );

  const regenerate = async () => {
    const res = await fetch(`/api/registrations/${registrationId}/regenerate-qr`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to regenerate QR code");
    const fresh = await res.json();
    // res.json() returns { data: { dataUrl } } — wrap to match SWR cache shape
    await mutate(fresh.data, false);
  };

  return { dataUrl: data?.dataUrl, isLoading, regenerate };
}
