import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Webhook verification
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify the webhook
  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified');
    return new NextResponse(challenge);
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle Instagram webhook events
    if (body.object === 'instagram') {
      const entries = body.entry || [];
      
      for (const entry of entries) {
        const changes = entry.changes || [];
        
        for (const change of changes) {
          if (change.field === 'comments') {
            console.log('New comment received:', change.value);
            // Here you could trigger your comment processing logic
          }
          
          if (change.field === 'mentions') {
            console.log('New mention received:', change.value);
            // Here you could trigger your mention processing logic
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
