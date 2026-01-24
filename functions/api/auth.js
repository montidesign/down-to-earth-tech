/**
 * OAuth initiation endpoint for Decap CMS
 * Redirects to GitHub for authentication
 */
export async function onRequest(context) {
  const { env } = context;

  const clientId = env.GITHUB_CLIENT_ID;
  const scope = 'repo,user';
  const redirectUri = `${new URL(context.request.url).origin}/api/callback`;

  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scope);

  return Response.redirect(authUrl.toString(), 302);
}
