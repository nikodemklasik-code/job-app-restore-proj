import { Navigate } from 'react-router-dom';

/** Style tools live under Document Lab → Build (no document uploads on this screen). */
export default function StyleStudioRedirect() {
  return <Navigate to="/documents?tab=build" replace />;
}
