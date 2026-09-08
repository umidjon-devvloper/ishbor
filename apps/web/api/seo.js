// robots.txt va sitemap'larni API'dan olib, SAYT domenida beradi.
//
// Ular API'da (Railway) generatsiya qilinadi, chunki vakansiya va kompaniya
// ro'yxati bazada. Lekin qidiruv tizimlari uchun bu fayllar aynan sayt
// domenida ochilishi shart — `https://sayt.uz/robots.txt`, API domenida emas.
// Shuning uchun `vercel.json` bu yo'llarni shu funksiyaga uzatadi, funksiya esa
// so'rovni API'ga o'tkazadi.
//
// Manzil qurilish paytida emas, ISHLASH paytida `process.env` dan olinadi —
// shuning uchun API domenini almashtirish uchun qayta build qilish shart emas.

const API_URL = (process.env.VITE_API_URL ?? process.env.API_URL ?? "").replace(/\/+$/, "");

// Faqat shu yo'llar uzatiladi — ochiq proxy bo'lib qolmasligi uchun.
const ALLOWED = /^\/(robots\.txt|sitemap(-[a-z]+)?\.xml)$/;

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export default async function handler(req, res) {
  const pathname = (req.url ?? "/").split("?")[0];

  if (!ALLOWED.test(pathname)) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  if (!API_URL) {
    // API manzili berilmagan — bo'sh robots o'rniga xavfsiz standart javob.
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("User-agent: *\nDisallow: /api\n");
    return;
  }

  try {
    const upstream = await fetch(`${API_URL}${pathname}`, {
      headers: { accept: "text/plain, application/xml, */*" },
    });
    const body = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") ??
        (pathname.endsWith(".xml") ? "application/xml" : "text/plain; charset=utf-8")
    );
    // Sitemap tez-tez o'zgarmaydi — bir soat kesh, keyin fonda yangilanadi.
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
    res.end(body);
  } catch (err) {
    console.error("[seo] API'ga ulanib bo'lmadi:", err);
    res.statusCode = 502;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("User-agent: *\nDisallow: /api\n");
  }
}
