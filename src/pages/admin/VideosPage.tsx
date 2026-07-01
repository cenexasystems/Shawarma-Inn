import { useAuth } from '../../hooks/useAuth';
import VideoManager from '../../components/admin/VideoManager';

export default function VideosPage() {
  const { token } = useAuth();
  const tokenRequired = token || '';

  return (
    <div className="animate-in fade-in duration-500">
      <VideoManager tokenRequired={tokenRequired} />
    </div>
  );
}
