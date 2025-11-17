import { useState, useEffect } from 'react';
import { buildTitle } from '../../constants/appMeta.js';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import PlayListItem from '../../components/PlayListItem/PlayListItem.jsx';
import { fetchUserPlaylists } from '../../api/spotify-me.js';
import { handleTokenError } from '../../utils/handleTokenError.js';
import './PlaylistsPage.css';
import '../PageLayout.css';
import { useNavigate } from 'react-router-dom';

/**
 * Number of playlists to fetch
 */
export const limit = 10;

/**
 * Playlists Page
 * @returns {JSX.Element}
 */
export default function PlaylistsPage() {
  // Initialize navigate function
  const navigate = useNavigate();

  // state for playlists data
  const [playlists, setPlaylists] = useState([]);
  // FIX: Déclaration de l'état totalCount
  const [totalCount, setTotalCount] = useState(0);

  // state for loading and error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // require token to fetch playlists
  const { token } = useRequireToken();

  // Set document title
  useEffect(() => { document.title = buildTitle('Playlists'); }, []);


  useEffect(() => {
    if (!token) return; // wait for auth check
    // fetch user playlists when token changes
    fetchUserPlaylists(token, limit)
      .then(res => {
        if (res.error) {
          if (!handleTokenError(res.error, navigate)) {
            setError(res.error);
          }
        } else { // FIX ROBUSTESSE: Traiter les données UNIQUEMENT s'il n'y a pas d'erreur
          setPlaylists(res.data.items);
          setTotalCount(res.data.total);
        }
      })
      .catch(err => { setError(err.message); })
      .finally(() => { setLoading(false); });
  }, [token, navigate]);

  return (
    <section className="playlists-container page-container" aria-labelledby="playlists-title">
      <h1 id="playlists-title" className="playlists-title page-title">Your Playlists</h1>
      {/* FIX: Afficher totalCount */}
      <h2 className="playlists-count">{totalCount} Playlists</h2>
      {loading && <output className="playlists-loading" data-testid="loading-indicator">Loading playlists…</output>}
      {error && !loading && <div className="playlists-error" role="alert">{error}</div>}
      {!loading && !error && (
        <ol className="playlists-list">
          {playlists.map((playlist) => (
            <PlayListItem key={playlist.id} playlist={playlist} />
          ))}
        </ol>
      )}
    </section>
  );
}