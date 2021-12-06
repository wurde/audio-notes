export default function SignOutButton({ setCognitoIdToken }) {
  return <button onClick={() => setCognitoIdToken(null)} className="p-6 text-gray-500 absolute bottom-0 right-0">Sign out</button>
}
