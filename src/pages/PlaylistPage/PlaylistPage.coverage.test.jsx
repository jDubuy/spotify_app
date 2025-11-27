import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Small helper to render the component after mocking modules via require
const renderPlaylist = (Component) => render(
    <MemoryRouter initialEntries={['/playlist/playlist1']}>
        <Routes>
            <Route path="/playlist/:id" element={<Component />} />
            <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
    </MemoryRouter>
);

test('early return when no token (shows introuvable)', async () => {
    jest.resetModules();
    // Mock hook to return no token
    jest.doMock('./../../hooks/useRequireToken.js', () => ({ useRequireToken: () => ({ token: null }) }));
    // Mock API to return nothing (shouldn't be called)
    jest.doMock('./../../api/spotify-playlists.js', () => ({ fetchPlaylistById: jest.fn() }));

    // Import the component after mocks
    // eslint-disable-next-line global-require
    const { default: PlaylistPage } = require('./PlaylistPage.jsx');

    renderPlaylist(PlaylistPage);

    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());
    expect(screen.getByText('Cette playlist est introuvable.')).toBeInTheDocument();
});

test('DOMParser fallback: when DOMParser throws use linear stripper', async () => {
    jest.resetModules();
    // Provide a token and stub API returning a description with tags
    jest.doMock('./../../hooks/useRequireToken.js', () => ({ useRequireToken: () => ({ token: 't' }) }));
    const htmlDesc = '<b>Bold</b> and <i>italic</i> <script>evil()</script>';
    jest.doMock('./../../api/spotify-playlists.js', () => ({
        fetchPlaylistById: jest.fn().mockResolvedValue({ data: {
            id: 'playlist1', name: 'P', description: htmlDesc, images: [{ url: 'x' }], owner: { display_name: 'u' }, tracks: { total: 0, items: [] }
        }, error: null })
    }));

    // Force DOMParser to throw inside the component to exercise fallback
    const realDOMParser = global.DOMParser;
    // eslint-disable-next-line no-global-assign
    global.DOMParser = function() { this.parseFromString = () => { throw new Error('boom'); } };

    // eslint-disable-next-line global-require
    const { default: PlaylistPage } = require('./PlaylistPage.jsx');
    renderPlaylist(PlaylistPage);

    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());
    expect(screen.getByText(/Bold/)).toBeInTheDocument();

    // restore DOMParser
    global.DOMParser = realDOMParser;
});

test('empty description shows fallback text', async () => {
    jest.resetModules();
    jest.doMock('./../../hooks/useRequireToken.js', () => ({ useRequireToken: () => ({ token: 't' }) }));
    jest.doMock('./../../api/spotify-playlists.js', () => ({
        fetchPlaylistById: jest.fn().mockResolvedValue({ data: {
            id: 'playlist1', name: 'P', description: '', images: [{ url: 'x' }], owner: { display_name: 'u' }, tracks: { total: 0, items: [] }
        }, error: null })
    }));

    // eslint-disable-next-line global-require
    const { default: PlaylistPage } = require('./PlaylistPage.jsx');
    renderPlaylist(PlaylistPage);

    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());
    expect(screen.getByText('Aucune description fournie.')).toBeInTheDocument();
});
