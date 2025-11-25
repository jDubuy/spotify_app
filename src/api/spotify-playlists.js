import { SPOTIFY_API_BASE } from "./spotify-commons.js";

/**
 * Fonction interne pour récupérer et accumuler toutes les pistes d'une playlist paginée.
 * @param {string} token - The Spotify access token.
 * @param {string} url - L'URL de l'API à appeler (initiale ou URL de pagination).
 * @param {object} accumulatedData - Les données de la playlist accumulées.
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
async function fetchPlaylistPage(token, url, accumulatedData = {}) {
    try {
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.error) {
            return { error: data.error.message, data: null };
        }

        // Si c'est le premier appel, initialiser les données complètes avec les métadonnées de la playlist
        if (Object.keys(accumulatedData).length === 0) {
            // Utiliser data.tracks.total si c'est la racine, sinon data.total si c'est une URL de piste pure
            accumulatedData = { ...data, tracks: { items: [], total: data.tracks.total || data.total } };
        }

        // Ajouter les pistes de la page actuelle
        accumulatedData.tracks.items.push(...(data.tracks ? data.tracks.items : data.items));

        // Vérifier s'il y a une page suivante dans la réponse
        const nextUrl = data.tracks ? data.tracks.next : data.next;
        
        if (nextUrl) {
            // Appel récursif pour la page suivante
            return await fetchPlaylistPage(token, nextUrl, accumulatedData);
        } else {
            // Aucune autre page, retourner les données complètes
            return { data: accumulatedData, error: null };
        }

    } catch  {
        // Capture des erreurs réseau ou autres
        return { error: 'Échec de la récupération des pistes durant la pagination.', data: null };
    }
}


/**
 * Fetch a Spotify playlist by its ID, incluant toutes les pistes (gestion de la pagination).
 * @param {string} token - The Spotify access token.
 * @param {string} playlistId - The ID of the playlist to fetch.
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
export async function fetchPlaylistById(token, playlistId) {
    if (!token) {
        return { error: 'No access token found.', data: null };
    }
    
    // URL initiale pour récupérer la playlist, y compris l'objet 'tracks'
    const initialUrl = `${SPOTIFY_API_BASE}/playlists/${playlistId}`;
    
    // Commencez l'appel récursif
    return fetchPlaylistPage(token, initialUrl);
}