"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function QrImage({ value }: { value: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { margin: 1, width: 240 }).then(
      (url) => alive && setSrc(url),
      () => alive && setSrc(null),
    );
    return () => {
      alive = false;
    };
  }, [value]);

  // eslint-disable-next-line @next/next/no-img-element -- data URL gerado no navegador
  return src ? (
    <img
      src={src}
      alt="QR code para conectar o WhatsApp"
      width={240}
      height={240}
      className="mx-auto rounded-2xl bg-white p-2"
    />
  ) : null;
}
