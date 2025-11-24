import { describe, expect, test } from '@jest/globals'
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import TopArtistItem from './TopArtistItem';

describe('TopArtistItem component', () => {
  test('renders artist information correctly and displays index starting from 1', () => {
    const artist = {
      id: 'artist1',
      name: 'Test Artist',
      images: [{ url: 'test.jpg' }, { url: 'test-medium.jpg' }, { url: 'test-small.jpg' }],
      genres: ['pop', 'rock'],
      followers: { total: 100 },
      popularity: 85,
      external_urls: { spotify: 'https://open.spotify.com/artist/artist1' }
    };
    render(<TopArtistItem artist={artist} index={0} />);

    const listItem = screen.getByTestId(`top-artist-item-${artist.id}`);
    expect(listItem).toBeInTheDocument();

    const img = within(listItem).getByAltText(artist.name);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', artist.images[1].url);

    expect(listItem).toHaveTextContent(artist.name);
    expect(listItem).toHaveTextContent(`Genres: ${artist.genres.join(', ')}`);
    expect(listItem).toHaveTextContent(`Followers: ${artist.followers.total.toLocaleString()}`);
    expect(listItem).toHaveTextContent(`Popularity: ${artist.popularity}`);

    // 🔥 Vérifie que l'index affiché commence à 1 quand index = 0
    expect(listItem).toHaveTextContent('1. Test Artist');

    const link = within(listItem).getByRole('link', { name: /view artist/i });
    expect(link).toHaveAttribute('href', artist.external_urls.spotify);
  });

  test('handles missing artist image gracefully', () => {
    const artist = {
      id: 'artist2',
      name: 'No Image Artist',
      genres: ['jazz'],
      followers: { total: 500 },
      external_urls: { spotify: 'https://open.spotify.com/artist/artist2' }
    };
    render(<TopArtistItem artist={artist} index={1} />);

    const listItem = screen.getByTestId(`top-artist-item-${artist.id}`);
    expect(listItem).toBeInTheDocument();

    expect(within(listItem).queryByAltText(artist.name)).not.toBeInTheDocument();

    expect(listItem).toHaveTextContent(artist.name);
    expect(listItem).toHaveTextContent(`Genres: ${artist.genres.join(', ')}`);
    expect(listItem).toHaveTextContent(`Followers: ${artist.followers.total.toLocaleString()}`);

    const link = within(listItem).getByRole('link', { name: /view artist/i });
    expect(link).toHaveAttribute('href', artist.external_urls.spotify);
  });
});
