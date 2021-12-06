const cognitoLoginEndpoint = `${process.env.NEXT_PUBLIC_COGNITO_USER_POOL_DOMAIN}/login?response_type=token&client_id=${process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_COGNITO_CALLBACK_URL}`;

export default function SignInButton() {
  const handleClick = () => {
    // If not signed in then redirect user to login.
    //
    // You don't need to use NextJS router.push for external URLs.
    // window.location is better suited for those cases.
    //
    // The Amazon Cognito Hosted UI provides you an OAuth 2.0
    // compliant authorization server. The user experience can be
    // customized by providing brand-specific logos, as well as
    // customizing the design of Hosted UI elements.
    //
    // https://aws.amazon.com/premiumsupport/knowledge-center/cognito-hosted-web-ui
    // https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html
    window.location = cognitoLoginEndpoint
  }

  return <button
    onClick={handleClick}
    className={`w-full py-6 bg-gray-100 hover:bg-gray-200 focus:bg-gray-300 border border-gray-600 text-4xl`}>
      Sign in
  </button>
}
