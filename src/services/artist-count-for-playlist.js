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
        const artistCounts = {};
        let nextUrl = null;
        let isFirstCall = true;

        // Boucle de pagination pour récupérer toutes les pistes
        while (isFirstCall || nextUrl) {
            
            // 1. Appel API : utilise la première fonction ou l'URL suivante pour la pagination
            // On suppose ici que fetchPlaylistById accepte un deuxième argument (l'URL) pour la pagination si ce n'est pas le premier appel.
            let response;
            if (isFirstCall) {
                response = await fetchPlaylistById(token, playlistId);
                isFirstCall = false;
            } else {
                // Vous devriez probablement avoir une fonction fetchByUrl pour les URLs paginées
                // Par souci de simplicité, nous allons appeler fetchPlaylistById avec l'URL complète
                // ATTENTION: Cela dépend de l'implémentation réelle de fetchPlaylistById.
                // Si fetchPlaylistById ne gère pas l'URL complète, cela peut échouer.
                // Alternativement, si une fonction fetchByUrl est disponible:
                // response = await fetchByUrl(token, nextUrl);
                
                // Pour l'instant, on suppose que le service qui appelle l'API de base sait gérer l'URL paginée.
                // Si fetchPlaylistById ne gère pas l'URL complète, le code suivant doit être adapté.
                
                // SIMPLIFICATION (peut nécessiter une fonction API dédiée dans le vrai projet):
                response = await fetchPlaylistById(token, nextUrl); 
            }

            // Gérer les erreurs de réponse de l'API
            if (response.error) {
                throw new Error(response.error);
            }

            const playlistData = response.data;

            if (!playlistData || !playlistData.tracks || !playlistData.tracks.items) {
                break; // Rien à traiter, sortir de la boucle
            }
            
            const tracksPage = playlistData.tracks;

            // 3. Parcourir et compter les artistes pour la page actuelle
            for (const trackItem of tracksPage.items) {
                const track = trackItem.track;

                if (track && track.artists) {
                    for (const artist of track.artists) {
                        const artistName = artist.name;
                        artistCounts[artistName] = (artistCounts[artistName] || 0) + 1;
                    }
                }
            }

            // Préparer la prochaine itération
            // L'API Spotify renvoie l'URL de la page suivante dans 'next'
            nextUrl = tracksPage.next;
            
            // Si nextUrl est null ou undefined, la boucle s'arrêtera à la prochaine condition du while.
        }

        return artistCounts;

    } catch (error) {
        console.error("Erreur lors du comptage des artistes:", error);
        return undefined; 
    }
}