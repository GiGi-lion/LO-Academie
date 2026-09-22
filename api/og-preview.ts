import type { IncomingMessage, ServerResponse } from 'http';

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(req: any, res: any) {
  try {
    const url = new URL(req.url, `https://${req.headers.host || 'www.lo-academie.nl'}`);
    const courseId = url.searchParams.get('cursus') || 
                     url.searchParams.get('course') || 
                     url.searchParams.get('id') || 
                     '';

    const defaultTitle = 'LO Academie - Scholingskalender voor LO-docenten';
    const defaultDescription = 'De centrale scholingskalender voor docenten Lichamelijke Opvoeding. Ontdek cursussen, workshops en studiedagen van KVLO en ALO-opleidingen.';
    const defaultImage = 'https://www.lo-academie.nl/og-image.jpg';
    const siteUrl = 'https://www.lo-academie.nl';

    let course: any = null;

    if (courseId) {
      const sbUrl = process.env.VITE_SUPABASE_URL || 'https://dvzqzdiqmiphvmtvqehu.supabase.co';
      const sbKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2enF6ZGlxbWlwaHZtdHZxZWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMTc3OTYsImV4cCI6MjA4OTc5Mzc5Nn0.QDK7evKGTf1xDUGBOq9YLLtCg5aUAk72-he1eX7KMdA';

      try {
        const queryUrl = `${sbUrl}/rest/v1/courses?id=eq.${encodeURIComponent(courseId)}&select=*`;
        const sbResponse = await fetch(queryUrl, {
          headers: {
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`
          }
        });

        if (sbResponse.ok) {
          const courses = await sbResponse.json();
          if (Array.isArray(courses) && courses.length > 0) {
            course = courses[0];
          }
        }
      } catch (err) {
        console.error('Error fetching course for OpenGraph preview:', err);
      }
    }

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
    // Ensure image URL is absolute
    const image = rawImage.startsWith('http') ? rawImage : `${siteUrl}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;
    const destinationUrl = course ? `${siteUrl}/?cursus=${encodeURIComponent(course.id)}` : siteUrl;

    const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(destinationUrl)}">

  <!-- Open Graph / LinkedIn / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="LO Academie">
  <meta property="og:url" content="${escapeHtml(destinationUrl)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(course?.title || 'LO Academie')}">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@LOAcademie">
  <meta name="twitter:url" content="${escapeHtml(destinationUrl)}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">

  <!-- Fallback instant redirect for real browsers -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(destinationUrl)}">
  <script>
    window.location.replace(${JSON.stringify(destinationUrl)});
  </script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f8fafc;
      color: #1e293b;
      text-align: center;
      padding: 24px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 480px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
    }
    h1 { font-size: 20px; margin-bottom: 12px; }
    p { color: #64748b; font-size: 14px; margin-bottom: 24px; }
    a {
      display: inline-block;
      background: #7AB800;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <p>Je wordt doorgestuurd naar de scholingspagina van LO Academie...</p>
    <a href="${escapeHtml(destinationUrl)}">Klik hier als je niet direct wordt doorgestuurd</a>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
    res.status(200).send(html);
  } catch (error: any) {
    console.error('Fatal in OG preview handler:', error);
    res.status(500).send('Internal Server Error');
  }
}
