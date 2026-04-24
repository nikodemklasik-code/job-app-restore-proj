import { Navigate } from 'react-router-dom';

/** Style tools live under Profile Documents → Style Studio (no document uploads on this screen). */
export default function StyleStudioRedirect() {
  return <Navigate to="/documents?tab=build" replace />;
}
