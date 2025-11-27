import { Link } from 'react-router-dom'; // AJOUT DE L'IMPORT LINK
import './PlayListItem.css';
import '../ListItem.css';

/**
 * Playlist item component
 * @param {*}  playlist 
 * @returns JSX.Element
 */
export default function PlayListItem({ playlist }) {
  const playlistLink = `/playlist/${playlist.id}`; // Création de l'URL de destination
    
  return (
    // L'élément li est conservé, mais le contenu principal est encapsulé par Link
    <li key={playlist.id} data-testid={`playlist-item-${playlist.id}`} className="list-item playlist-item">
      
      {/* NOUVEAU LIEN VERS LA PAGE DE DÉTAIL */}
      <Link to={playlistLink} className="playlist-link-wrapper">
        <img
          src={playlist.images[0]?.url}
          alt="cover"
          className="playlist-item-cover"
        />
        <div className="playlist-item-details">
          <div className="playlist-item-details-header">
            <div className="playlist-item-title">{playlist.name}</div>
            <div className="playlist-item-owner">By {playlist.owner.display_name}</div>
          </div>
          <div className="playlist-item-tracks">{playlist.tracks.total} tracks</div>
        </div>
      </Link>
      
      {/* Le lien externe "Open" est conservé à l'extérieur du lien interne pour ne pas interférer avec la navigation */}
      <a
        href={playlist.external_urls.spotify}
        target="_blank"
        rel="noopener noreferrer"
        className="playlist-link"
        aria-label={`Open ${playlist.name} in Spotify`}
      >
        Open
      </a>
    </li>
  );
}