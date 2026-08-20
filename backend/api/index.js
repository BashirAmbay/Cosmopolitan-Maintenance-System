export default async function handler(req, res) {
  try {
    const { default: app } = await import('../src/app.js');
    return app(req, res);
  } catch (error) {
    console.error('Vercel Serverless Function Startup Error:', error);
    res.status(500).json({
      error: 'Serverless Function Initialization Error',
      message: error.message,
      details: error.toString(),
      stack: error.stack
    });
  }
}
