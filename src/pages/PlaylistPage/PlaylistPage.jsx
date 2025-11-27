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

    // Récupère le token avant d'initialiser l'état `loading` afin d'éviter
    // d'appeler setState de façon synchrone dans un effet lorsque le token est absent.
    const { token } = useRequireToken();

    const [playlist, setPlaylist] = useState(null);
    const [tracks, setTracks] = useState([]);
    // Initialise `loading` en fonction de la présence du token et de l'id
    const [loading, setLoading] = useState(() => Boolean(token && playlistId));
    const [error, setError] = useState(null);

    useEffect(() => {
        if (playlist) {
            document.title = buildTitle(playlist.name);
        } else {
            document.title = buildTitle('Playlist');
        }
    }, [playlist]);

    useEffect(() => {
        if (!token || !playlistId) {
            // Si pas de token ou pas d'id de playlist, on ne lance pas l'appel.
            // `loading` a été initialisé correctement en fonction du token,
            // donc on évite d'appeler setState ici (évite setState synchrone dans l'effet).
            return;
        }

        // Reset states
        // NOTE: we intentionally set state here to reflect fetch lifecycle;
        // disable the lint rule because this state update is tied to the
        // side-effect of starting an asynchronous fetch and is safe here.
        /* eslint-disable-next-line react-hooks/set-state-in-effect */
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
    // Sanitize description: use DOMParser in the browser (linear, safe) and
    // fallback to a conservative regex that avoids catastrophic backtracking.
    const stripHtml = (html) => {
        if (!html) return '';
        try {
            if (typeof DOMParser !== 'undefined') {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                return doc.body.textContent || '';
            }
        } catch {
            // fallthrough to regex fallback
        }
        // Fallback: linear-time manual tag stripper to avoid any regex backtracking
        let out = '';
        let inTag = false;
        for (let i = 0; i < html.length; i++) {
            const ch = html[i];
            if (inTag) {
                if (ch === '>') inTag = false;
            } else {
                if (ch === '<') {
                    inTag = true;
                } else {
                    out += ch;
                }
            }
        }
        return out;
    };

    const descriptionText = stripHtml(playlist.description) || 'Aucune description fournie.';

    return (
        <section className="playlist-detail-container page-container" aria-labelledby="playlist-title">
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