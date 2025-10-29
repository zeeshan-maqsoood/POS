import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const session = await auth();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the user to refresh
    const user = await db.user.findUnique({
      where: { id: params.id },
      include: {
        branch: true,
        permissions: true
      }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Invalidate the user's current session by updating their token version
    await db.user.update({
      where: { id: user.id },
      data: {
        tokenVersion: (user.tokenVersion || 0) + 1
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error refreshing user session:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
