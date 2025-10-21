/**
 * API endpoint to pull WordPress theme stylesheet
 * This is currently a placeholder - the actual implementation
 * will be done via playground.js calling WordPress directly
 */

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { playgroundUrl } = await req.json();

    if (!playgroundUrl) {
      return Response.json(
        { success: false, error: 'Playground URL is required' },
        { status: 400 }
      );
    }

    // This endpoint is a placeholder - the actual stylesheet fetching
    // happens client-side via playground.js calling WordPress Playground directly
    // We return instructions for the frontend to call window.getWordPressStylesheet()

    return Response.json({
      success: true,
      message: 'Call window.getWordPressStylesheet() from the frontend to fetch the stylesheet',
      instructions: {
        method: 'window.getWordPressStylesheet',
        description: 'This function is available in playground.js and directly queries WordPress'
      }
    });

  } catch (error: any) {
    console.error('Get stylesheet error:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to get stylesheet'
      },
      { status: 500 }
    );
  }
}
