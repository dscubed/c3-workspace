"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ViewWithRedirect({ to, delay = 5000, children }: {
  to: string,
  delay?: number,
  children: ReactNode
}) {
  const router = useRouter();
  useEffect(() => {
    const timeout = setTimeout(() => router.push(to), delay);
    return () => clearTimeout(timeout);
  }, [to, delay, router]);

  return (
    <>
      {children}
    </>
  )
}