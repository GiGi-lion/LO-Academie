import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

export default async function handler(req: any, res: any) {
  const host = req.headers?.host || 'www.lo-academie.nl';
  const rawUrl = req.url || '';
  const url = new URL(rawUrl, `https://${host}`);

  const courseId = url.searchParams.get('cursus') || 
                   url.searchParams.get('course') || 
                   url.searchParams.get('id') || 
                   (typeof req.query?.cursus === 'string' ? req.query.cursus : '') ||
                   (typeof req.query?.course === 'string' ? req.query.course : '') ||
                   (typeof req.query?.id === 'string' ? req.query.id : '');

  const customImageUrl = url.searchParams.get('url') || 
                         (typeof req.query?.url === 'string' ? req.query.url : '');

  const serveFallbackImage = () => {
    try {
      const fallbackPath = path.join(process.cwd(), 'public', 'og-image.jpg');
      if (fs.existsSync(fallbackPath)) {
        const fileBuffer = fs.readFileSync(fallbackPath);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800');
        return res.status(200).send(fileBuffer);
      }
    } catch (e) {
      console.error('Error reading fallback image:', e);
    }
    // As last resort, redirect to absolute fallback URL
    return res.redirect(302, 'https://www.lo-academie.nl/og-image.jpg');
  };

  let targetImageUrl: string | null = customImageUrl || null;

  // If a course ID is provided, query Supabase for the course image
  if (!targetImageUrl && courseId) {
    const sbUrl = process.env.VITE_SUPABASE_URL || 'https://dvzqzdiqmiphvmtvqehu.supabase.co';
    const sbKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2enF6ZGlxbWlwaHZtdHZxZWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMTc3OTYsImV4cCI6MjA4OTc5Mzc5Nn0.QDK7evKGTf1xDUGBOq9YLLtCg5aUAk72-he1eX7KMdA';

    try {
      const queryUrl = `${sbUrl}/rest/v1/courses?id=eq.${encodeURIComponent(courseId)}&select=id,imageUrl,image`;
      const sbResponse = await fetch(queryUrl, {
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`
        }
      });

      if (sbResponse.ok) {
        const courses = await sbResponse.json();
        if (Array.isArray(courses) && courses.length > 0) {
          targetImageUrl = courses[0].imageUrl || courses[0].image || null;
        }
      }
    } catch (err) {
      console.error('Error querying course image in og-image proxy:', err);
    }
  }

  // If no image specified or relative, handle fallback
  if (!targetImageUrl || !targetImageUrl.startsWith('http')) {
    return serveFallbackImage();
  }

  // Fetch the image with standard browser headers to bypass hotlinking / anti-bot blocks
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const imageResponse = await fetch(targetImageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': targetImageUrl.startsWith('https://www.han.nl') ? 'https://www.han.nl/' : 'https://www.lo-academie.nl/'
      }
    });

    clearTimeout(timeoutId);

    if (!imageResponse.ok) {
      console.warn(`Upstream image returned status ${imageResponse.status} for ${targetImageUrl}`);
      return serveFallbackImage();
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    // If upstream didn't return an image, fallback
    if (!contentType.startsWith('image/')) {
      console.warn(`Upstream did not return an image content-type: ${contentType}`);
      return serveFallbackImage();
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800');
    return res.status(200).send(buffer);
  } catch (fetchError) {
    console.error('Failed to proxy course image:', fetchError);
    return serveFallbackImage();
  }
}
