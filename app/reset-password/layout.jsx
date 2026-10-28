// The page itself is a client component, so its metadata lives here. Password
// reset pages must not be indexed.
export const metadata = {
  title: 'Reset your password',
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }) {
  return children;
}
