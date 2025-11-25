import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { buildTitle } from '../../constants/appMeta.js';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import { fetchPlaylistById } from '../../api/spotify-playlists.js';
import { handleTokenError } from '../../utils/handleTokenError.js';
import TrackItem from '../../components/TrackItem/TrackItem.jsx';
import './PlaylistPage.css';
import '../PageLayout.css';

/**
 * Playlist Detail Page
 * @returns {JSX.Element}
 */
export default function PlaylistPage() {
    const { id: playlistId } = useParams();
    const navigate = useNavigate();
    
    const [playlist, setPlaylist] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { token } = useRequireToken();

    useEffect(() => {
        if (playlist) {
            document.title = buildTitle(playlist.name);
        } else {
            document.title = buildTitle('Playlist');
        }
    }, [playlist]);

    useEffect(() => {
        if (!token || !playlistId) {
            if (!token) setLoading(false);
            return;
        }

        // Reset states
        setLoading(true);
        setError(null);

        fetchPlaylistById(token, playlistId)
            .then(res => {
                if (res.error) {
                    // En cas d'erreur, on set l'erreur et on arrête le chargement
                    if (!handleTokenError(res.error, navigate)) {
                        setError(res.error);
                    }
                    // IMPORTANT: Le chargement est fini ici pour le cas d'erreur
                    setLoading(false);
                } else {
                    // Succès
                    const data = res.data;
                    setPlaylist(data);
                    if (data.tracks && data.tracks.items) {
                        setTracks(data.tracks.items.map(item => item.track).filter(track => track !== null));
                    }
                    // IMPORTANT: Le chargement est fini ici pour le cas succès
                    setLoading(false);
                }
            })
            .catch(err => {
                // Erreur réseau
                setError(err.message || 'Une erreur est survenue');
                // IMPORTANT: Le chargement est fini ici pour le cas catch
                setLoading(false);
            });
            // NOTE: Pas de .finally() pour setLoading(false) ici pour éviter les conflits d'état
    }, [token, playlistId, navigate]);

    const handleOpenInSpotify = () => {
        if (playlist && playlist.external_urls && playlist.external_urls.spotify) {
            window.open(playlist.external_urls.spotify, '_blank');
        }
    };

    // --- LOGIQUE DE RENDU STRICTE ---
    
    // 1. Chargement
    if (loading) {
        return <output className="page-loading" data-testid="loading-indicator">Chargement de la playlist...</output>;
    }

    // 2. Erreur (Prioritaire sur le contenu vide)
    if (error) {
        return <div className="page-error" role="alert">Erreur lors du chargement : {error}</div>;
    }

    // 3. Playlist introuvable (Si pas de chargement, pas d'erreur, mais pas de données)
    if (!playlist) {
        return <div className="page-error" role="alert">Cette playlist est introuvable.</div>;
    }
    
    // 4. Affichage du contenu (Succès)
    const descriptionText = playlist.description 
        ? playlist.description.replace(/<[^>]*>/g, '') 
        : 'Aucune description fournie.';

    return (
        <section className="playlist-detail-container page-container" aria-labelledby="playlist-title" role="region">
            <header className="playlist-header">
                <img 
                    src={playlist.images?.[0]?.url || 'placeholder.png'} 
                    alt={`Couverture de ${playlist.name}`} 
                    className="playlist-cover"
                />
                <div className="playlist-info">
                    <h1 id="playlist-title" className="playlist-title page-title">{playlist.name}</h1>
                    <h2 className="playlist-subtitle page-subtitle">{descriptionText}</h2> 
                    <p className="playlist-owner">Créée par : {playlist.owner?.display_name}</p>
                    <p className="playlist-track-count">{playlist.tracks.total} pistes</p>
                    <button 
                        onClick={handleOpenInSpotify} 
                        className="open-spotify-button"
                        aria-label={`Lire la playlist ${playlist.name} sur Spotify`}
                        role="link"
                    >
                        Open in Spotify
                    </button>
                </div>
            </header>

            {tracks.length > 0 ? (
                <div className="playlist-tracks">
                    <h2>Pistes dans la playlist</h2>
                    <ol className="tracks-list playlist-list"> 
                        {tracks.map((track) => (
                            <TrackItem key={track.id} track={track} />
                        ))}
                    </ol>
                </div>
            ) : (
                <div className="playlist-empty-message">Cette playlist est vide.</div>
            )}
        </section>
    );
}