// src/components/PlayListItem.test.jsx

import { describe, expect, test } from '@jest/globals'
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom'; // 👈 AJOUT DE L'IMPORT
import PlayListItem from './PlayListItem';

describe('PlayListItem component', () => {
    test('renders playlist information correctly', () => {
        // Arrange
        const playlist = {
            id: 'playlist1',
            name: 'Test Playlist',
            images: [{ url: 'test.jpg' }],
            owner: { display_name: 'Test Owner' },
            tracks: { total: 15 },
            external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' }
        };
        // Act
        // FIX : Encapsuler PlayListItem dans MemoryRouter pour fournir le contexte de Link
        render(
            <MemoryRouter>
                <PlayListItem playlist={playlist} />
            </MemoryRouter>
        );

        // Assert
        // items are rendered correctly
        expect(screen.getByTestId(`playlist-item-${playlist.id}`)).toBeInTheDocument();
        // image is rendered correctly
        expect(screen.getByAltText('cover')).toHaveAttribute('src', playlist.images[0].url);
        // text content is rendered correctly
        expect(screen.getByText(playlist.name)).toBeInTheDocument();
        // owner name is rendered correctly
        expect(screen.getByText(`By ${playlist.owner.display_name}`)).toBeInTheDocument();
        // track count is rendered correctly
        expect(screen.getByText(`${playlist.tracks.total} tracks`)).toBeInTheDocument();
        // link is rendered correctly
        // NOTE: Il y a maintenant DEUX liens (le Link interne et le <a> externe), le test doit s'adapter
        // Je vérifie le lien externe 'Open'
        expect(screen.getByRole('link', { name: /Open/i })).toHaveAttribute('href', playlist.external_urls.spotify);
    });
});