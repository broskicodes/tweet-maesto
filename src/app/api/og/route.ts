import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    const res = await fetch(url)
    const html = await res.text()
    
    // Basic regex to extract OG tags
    const image = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/)?.[1]
      || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:image"[^>]*>/)?.[1]
    
    const title = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/)?.[1]
      || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"[^>]*>/)?.[1]
    
    const description = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/)?.[1]
      || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:description"[^>]*>/)?.[1]

    return NextResponse.json({
      url,
      title,
      description,
      image,
    })
  } catch (error) {
    // console.error('OG scrape error:', error)
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 })
  }
}