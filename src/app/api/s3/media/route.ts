import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/aws";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key');

  console.log("key", key);
  if (!key) {
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
    });
    
    const response = await s3Client.send(command);
    
    if (!response.Body) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Convert the readable stream to a Response
    const headers = new Headers({
      'Content-Type': response.ContentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000'
    });

    return new Response(response.Body as ReadableStream, { headers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
};