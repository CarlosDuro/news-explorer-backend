const NEWS_API_URL = 'https://newsapi.org/v2/everything';

function mapArticle(a) {
  return {
    title: a.title || 'Untitled',
    text: a.description || '',
    date: (a.publishedAt || '').slice(0, 10),
    source: a.source?.name || 'Web',
    link: a.url || '#',
    image: a.urlToImage || 'https://picsum.photos/600/400',
  };
}

export async function searchNews(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.status(400).json({ message: 'Missing query param q' });

    const key = process.env.NEWS_API_KEY || '';
    if (!key) {
      // Fallback demo (sin API key)
      const now = new Date().toISOString().slice(0, 10);
      const demo = Array.from({ length: 6 }).map((_, i) => ({
        title: `${q}: headline #${i + 1}`,
        text: 'Demo article...',
        date: now,
        source: 'Demo',
        link: 'https://example.com',
        image: 'https://picsum.photos/600/400',
      }));
      return res.json({ query: q, total: demo.length, items: demo });
    }

    const url = new URL(NEWS_API_URL);
    url.searchParams.set('q', q);
    url.searchParams.set('language', process.env.NEWS_API_LANG || 'es');
    url.searchParams.set('pageSize', '10');
    url.searchParams.set('sortBy', 'publishedAt');
    url.searchParams.set('apiKey', key);

    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ message: data?.message || 'News API error' });

    const items = (data.articles || []).map(mapArticle);
    res.json({ query: q, total: items.length, items });
  } catch (e) {
    next(e);
  }
}
