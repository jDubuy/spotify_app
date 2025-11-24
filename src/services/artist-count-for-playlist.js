import { fetchPlaylistById } from '../api/spotify-playlists.js'; 

/**
 * Compte le nombre d'apparitions de chaque artiste dans une playlist Spotify.
 * @param {string} token Le token d'accès Spotify.
 * @param {string} playlistId L'ID de la playlist.
 * @returns {Promise<Object<string, number>>} Un objet {nomArtiste: nombreOccurrences} ou undefined en cas d'erreur.
 */
export async function artistCountForPlaylist(token, playlistId) {
    if (!token || !playlistId) {
        return Promise.reject(new Error("Le Token et l'ID de la playlist doivent être fournis."));
    }

    try {
        const response = await fetchPlaylistById(token, playlistId);

        if (response.error) {
            throw new Error(response.error);
        }

        const playlistData = response.data;
        const artistCounts = {};

        if (!playlistData || !playlistData.tracks || !playlistData.tracks.items) {
            return artistCounts;
        }

        for (const trackItem of playlistData.tracks.items) {
            const track = trackItem.track;

            if (track && track.artists) {
                for (const artist of track.artists) {
                    const artistName = artist.name;
                    artistCounts[artistName] = (artistCounts[artistName] || 0) + 1;
                }
            }
        }

        return artistCounts;

    } catch (error) {
        // Le test unitaire attend que l'on loggue et retourne 'undefined' en cas d'échec réseau.
        console.error("Erreur lors du comptage des artistes:", error);
        return undefined; 
    }
}