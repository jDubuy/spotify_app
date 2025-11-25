import { describe, expect, test } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PlaylistPage from './PlaylistPage.jsx';
import * as spotifyApi from '../../api/spotify-playlists.js';
import { beforeEach, afterEach, jest } from '@jest/globals';
import { KEY_ACCESS_TOKEN } from '../../constants/storageKeys.js';
import { buildTitle } from '../../constants/appMeta.js';
import * as handleTokenErrorModule from '../../utils/handleTokenError.js';

// Garantit la présence d'un token pour que les useEffect déclenchent les appels API
jest.mock('../../hooks/useRequireToken.js', () => ({
    useRequireToken: () => ({ token: 'test-token' })
}));

// ... (Rest of the test code I provided in the previous response)
const playlistData = {
    id: 'playlist1',
    name: 'My Playlist 1',
    description: 'A cool playlist',
    images: [{ url: 'https://via.placeholder.com/56' }],
    owner: { display_name: 'User1' },
    external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' },
    tracks: { 
        total: 1, 
        items: [
            {
                track: {
                    id: 'track1',
                    name: 'Track One',
                    artists: [{ name: 'Artist A' }],
                    album: { name: 'Album X', images: [{ url: 'https://via.placeholder.com/56' }] },
                    duration_ms: 210000,
                    external_urls: { spotify: 'https://open.spotify.com/track/track1' },
                },
            },
        ],
    },
};

// Mock de la fonction d'API pour retourner les données correctement
const mockFetchPlaylistById = (data, error = null) => ({ data, error });


describe('PlaylistPage', () => {
    const tokenValue = 'test-token';

    beforeEach(() => {
        // Mock localStorage token
        jest.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation((key) => key === KEY_ACCESS_TOKEN ? tokenValue : null);
        
        // FIX: Assure que handleTokenError est toujours espionné AVANT les tests
        jest.spyOn(handleTokenErrorModule, 'handleTokenError').mockImplementation(() => false); // Par défaut: ne pas rediriger

        // Default mock: successful playlist fetch (important pour le premier test)
        jest.spyOn(spotifyApi, 'fetchPlaylistById').mockResolvedValue(mockFetchPlaylistById(playlistData));
    });

    afterEach(() => {
        // Restauration de tous les mocks après chaque test
        jest.restoreAllMocks();
    });

    const renderPlaylistPage = (initialEntries, mockApiError = null) => {
        // Ce mock sert uniquement à surcharger l'appel API pour les tests d'erreur
        if (mockApiError) {
             jest.spyOn(spotifyApi, 'fetchPlaylistById').mockResolvedValue({ data: null, error: mockApiError });
        }
        
        return render(
            <MemoryRouter initialEntries={initialEntries}>
                <Routes>
                    <Route path="/playlist/:id" element={<PlaylistPage />} />
                    <Route path="/login" element={<div>Login Page</div>} /> 
                </Routes>
            </MemoryRouter>
        );
    };

    test('fetches and renders playlist, sets title', async () => {
        renderPlaylistPage(['/playlist/playlist1']);

        // Check document title initial
        expect(document.title).toBe(buildTitle('Playlist'));
        
        // Le loader peut disparaître très vite si le mock de l'API résout immédiatement.
        // On attend simplement qu'il ne soit plus présent avant de vérifier le rendu final.
        await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());
        
        // L'état de succès : vérification du contenu
        const heading = await screen.findByRole('heading', { level: 1, name: playlistData.name });
        expect(heading).toBeInTheDocument();
        
        // Autres assertions de succès
        const img = screen.getByAltText(`Couverture de ${playlistData.name}`); 
        expect(img).toHaveAttribute('src', playlistData.images[0].url); 

        const description = await screen.findByRole('heading', { level: 2, name: playlistData.description });
        expect(description).toBeInTheDocument();

        // Le bouton ouvre Spotify via window.open (role=link mais sans href). On teste l'appel à window.open.
        const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
        const link = screen.getByRole('link', { name: /Lire la playlist/i });
        // simuler le clic
        link.click();
        expect(openSpy).toHaveBeenCalledWith(playlistData.external_urls.spotify, '_blank');
        openSpy.mockRestore();

        for (const track of playlistData.tracks.items) {
            expect(await screen.findByTestId(`track-item-${track.track.id}`)).toBeInTheDocument();
        }

        await waitFor(() => expect(spotifyApi.fetchPlaylistById).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(spotifyApi.fetchPlaylistById).toHaveBeenCalledWith(tokenValue, 'playlist1'));
    });

    test('displays error message on API fetch failure', async () => {
        // FIX : Mock pour API qui renvoie un message d'erreur
        renderPlaylistPage(['/playlist/playlist1'], 'Failed to fetch playlist');

        await waitFor(() => {
            expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        });

        // FIX : Le composant affichera "Erreur lors du chargement : " + message grâce à l'ordre des conditions
        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Erreur lors du chargement : Failed to fetch playlist');
    });

    test('displays error message on network failure', async () => {
        // FIX : Mock pour fetch qui rejette la promesse (erreur réseau)
        jest.spyOn(spotifyApi, 'fetchPlaylistById').mockRejectedValue(new Error('Network error occurred'));

        renderPlaylistPage(['/playlist/playlist1']);

        await waitFor(() => {
            expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        });

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Erreur lors du chargement : Network error occurred');
    });

    test("redirects to login on token expiry error", async () => {
        // FIX : Surcharge du mock pour simuler la redirection (appel navigate('/login'))
        jest.spyOn(handleTokenErrorModule, 'handleTokenError').mockImplementation((err, navigate) => {
            navigate('/login');
            return true;
        });
        jest.spyOn(spotifyApi, 'fetchPlaylistById').mockResolvedValue({ data: null, error: 'The access token expired' });

        render(
            <MemoryRouter initialEntries={['/playlist/playlist1']}>
                <Routes>
                    <Route path="/playlist/:id" element={<PlaylistPage />} />
                    <Route path="/login" element={<div>Login Page</div>} /> 
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        });

        // FIX : Vérifie que handleTokenError a été appelé
        expect(handleTokenErrorModule.handleTokenError).toHaveBeenCalledWith('The access token expired', expect.any(Function));
        
        // FIX : Vérifie que la page Login est rendue après la redirection simulée
        await waitFor(() => {
            expect(screen.getByText('Login Page')).toBeInTheDocument();
        });
    });
});