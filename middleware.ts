function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const BOT_USER_AGENTS = /LinkedInBot|facebookexternalhit|Facebot|Twitterbot|WhatsApp|TelegramBot|Discordbot|Slackbot|SkypeUriPreview|Google-InspectionTool|bingbot/i;

export const config = {
  matcher: ['/', '/cursus/:path*'],
};

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  const isBot = BOT_USER_AGENTS.test(userAgent);

  let courseId = url.searchParams.get('cursus') || url.searchParams.get('course') || '';

  if (!courseId && url.pathname.startsWith('/cursus/')) {
    courseId = url.pathname.replace('/cursus/', '').split('/')[0];
  }

  // If a bot is requesting a course, generate and return the rich Open Graph HTML directly
  if (isBot && courseId) {
    const sbUrl = 'https://dvzqzdiqmiphvmtvqehu.supabase.co';
    const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2enF6ZGlxbWlwaHZtdHZxZWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMTc3OTYsImV4cCI6MjA4OTc5Mzc5Nn0.QDK7evKGTf1xDUGBOq9YLLtCg5aUAk72-he1eX7KMdA';

    let course: any = null;
    try {
      const res = await fetch(`${sbUrl}/rest/v1/courses?id=eq.${encodeURIComponent(courseId)}&select=*`, {
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          course = data[0];
        }
      }
    } catch (e) {
      console.error('Middleware Supabase fetch error:', e);
    }

    const defaultTitle = 'LO Academie - Scholingskalender voor LO-docenten';
    const defaultDescription = 'De centrale scholingskalender voor docenten Lichamelijke Opvoeding. Ontdek cursussen, workshops en studiedagen van KVLO en ALO-opleidingen.';
    const defaultImage = 'https://www.lo-academie.nl/og-image.jpg';
    const siteUrl = 'https://www.lo-academie.nl';

    const title = course ? `${course.title} | LO Academie` : defaultTitle;

    let description = defaultDescription;
    if (course) {
      const parts: string[] = [];
      if (course.organizer || course.organizers) {
        const org = course.organizer || (Array.isArray(course.organizers) ? course.organizers.join(', ') : course.organizers);
        parts.push(`Aanbieder: ${org}.`);
      }
      if (course.location) {
        parts.push(`Locatie: ${course.location}.`);
      }
      if (course.description) {
        parts.push(course.description);
      }
      description = parts.join(' ').slice(0, 280);
      if (parts.join(' ').length > 280) {
        description += '...';
      }
    }

    const rawImage = course?.imageUrl || course?.image_url || defaultImage;
    const image = rawImage.startsWith('http') ? rawImage : `${siteUrl}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;
    const canonicalUrl = course ? `${siteUrl}/cursus/${encodeURIComponent(course.id)}` : siteUrl;
    const destinationUrl = course ? `${siteUrl}/?cursus=${encodeURIComponent(course.id)}` : siteUrl;

    const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">

  <!-- Open Graph / LinkedIn / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="LO Academie">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(course?.title || 'LO Academie')}">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@LOAcademie">
  <meta name="twitter:url" content="${escapeHtml(canonicalUrl)}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">

  <!-- Fallback instant redirect for real browsers -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(destinationUrl)}">
  <script>
    window.location.replace(${JSON.stringify(destinationUrl)});
  </script>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <a href="${escapeHtml(destinationUrl)}">Bekijk scholing</a>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
      },
    });
  }

  // If a human visitor navigates to /cursus/:id, redirect them to /?cursus=:id
  if (url.pathname.startsWith('/cursus/')) {
    const id = url.pathname.replace('/cursus/', '').split('/')[0];
    if (id) {
      return Response.redirect(new URL(`/?cursus=${encodeURIComponent(id)}`, request.url), 302);
    }
  }

  // Otherwise continue normally to the SPA
}
