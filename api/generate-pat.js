// This is a Vercel serverless function
// File location: api/generate-pat.js

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, appId } = req.body;

  // Validate input
  if (!email || !appId) {
    return res.status(400).json({ error: 'Email and appId are required' });
  }

  // Whitelist of allowed emails (only demo user has access)
  const allowedEmails = ['demo@tooljet.com'];
  
  if (!allowedEmails.includes(email)) {
    return res.status(403).json({ error: 'This email does not have access to the application' });
  }

  try {
    // Call ToolJet API to generate PAT
    const tooljetResponse = await fetch(
      `${process.env.TOOLJET_URL}/api/ext/users/personal-access-token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${process.env.TOOLJET_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          appId: appId,
          sessionExpiry: 60,  // 60 minutes
          patExpiry: 3600     // 1 hour in seconds
        })
      }
    );

    if (!tooljetResponse.ok) {
      const errorData = await tooljetResponse.text();
      console.error('ToolJet API Error:', errorData);
      throw new Error(`ToolJet API returned ${tooljetResponse.status}`);
    }

    const data = await tooljetResponse.json();
    
    // Return the embed URL
    return res.status(200).json({ 
      embedUrl: data.redirectUrl 
    });

  } catch (error) {
    console.error('Error generating PAT:', error);
    return res.status(500).json({ 
      error: 'Failed to generate access token',
      details: error.message 
    });
  }
}