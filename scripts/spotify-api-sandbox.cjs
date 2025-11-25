// ./scripts/spotify-api-sandbox.cjs

const { generateAccessToken } = require("./utils.cjs");
const { fetchPlaylistById } = require("../src/api/spotify-playlists.js"); // Conservation pour référence, mais pas utilisé directement
const { artistCountForPlaylist } = require("../src/services/artist-count-for-playlist.js"); // Importation de votre nouveau service

/**
 * Main function to demonstrate fetching a Spotify playlist and counting artists.
 */
const main = async () => {
    // ID de la playlist utilisée dans l'exemple du ticket
    // Vous pouvez remplacer cet ID par celui que vous voulez tester.
    var playlistId = "1X1j2qoMSggISmtfpKz17p"; 

    const token = await generateAccessToken();

    if (!token) {
        console.error("FATAL: SPOTIFY_ACCESS_TOKEN non trouvé. Assurez-vous d'avoir un fichier .env.local.");
        return;
    }
    
    try {
        console.log(`\n--- DÉBUT COMPTAGE D'ARTISTES (Service: artistCountForPlaylist) ---`);

        // 1. Appel de VOTRE NOUVEAU SERVICE
        const counts = await artistCountForPlaylist(token, playlistId);

        if (!counts) {
            console.log(`Le service n'a pas pu retourner les comptes pour la playlist ID: ${playlistId}.`);
            return;
        }

        // 2. Transformer le résultat en tableau trié
        const sortedArtists = Object.entries(counts)
            .map(([artist, count]) => ({ Artist: artist, 'Number of Tracks': count }))
            .sort((a, b) => b['Number of Tracks'] - a['Number of Tracks']);

        const topLimit = 5;

        console.log(`\nTop ${topLimit} Artists (Playlist ID: ${playlistId}):`);
        
        // 3. Afficher le tableau formaté (comme dans l'exemple du ticket)
        console.table(sortedArtists.slice(0, topLimit));

        console.log(`--- FIN COMPTAGE D'ARTISTES ---`);

    } catch (error) {
        console.error("Erreur générale dans le sandbox:", error.message);
    }
};

main();