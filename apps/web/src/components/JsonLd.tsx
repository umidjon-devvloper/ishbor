import React from "react";

/**
 * JSON-LD structured data. Oddiy <script>{JSON.stringify(...)}</script> ishlatib
 * bo'lmaydi — React matnni HTML-escape qiladi (&quot;) va Google o'qiy olmaydi.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
