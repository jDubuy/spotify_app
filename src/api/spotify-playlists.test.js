// src/api/spotify-playlists.test.js
import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { fetchPlaylistById } from "./spotify-playlists";
import { SPOTIFY_API_BASE } from "./spotify-commons";

describe("spotify-playlists API", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe("fetchPlaylistById", () => {
    test("returns error if no token is provided", async () => {
      const result = await fetchPlaylistById("", "playlist123");
      expect(result).toEqual({
        error: "No access token found.",
        data: null,
      });
    });

    test("returns playlist on successful fetch", async () => {
      // FIX 1: Mock la pagination complète (première et dernière page)
      const mockPlaylistPage1 = {
        id: "playlist123",
        name: "My Playlist",
        owner: { display_name: "User" },
        tracks: {
          items: [{ track: { id: 't1' } }, { track: { id: 't2' } }],
          total: 3,
          next: `${SPOTIFY_API_BASE}/playlists/playlist123/tracks?offset=2`, // URL de la page suivante
        }
      };
      
      const mockPlaylistPage2 = {
        tracks: {
          items: [{ track: { id: 't3' } }], // Dernier élément
          total: 3,
          next: null, // Fin de la pagination
        }
      };

      // Mock fetch pour simuler les deux appels API nécessaires
      globalThis.fetch = jest.fn()
        .mockResolvedValueOnce({ // Première page
          json: jest.fn().mockResolvedValue(mockPlaylistPage1),
        })
        .mockResolvedValueOnce({ // Deuxième page (URL paginée)
          json: jest.fn().mockResolvedValue(mockPlaylistPage2),
        });

      const result = await fetchPlaylistById("valid_token", "playlist123");
      
      // Vérification que les deux appels ont été faits
      expect(globalThis.fetch).toHaveBeenCalledTimes(2); 
      
      // Vérification du premier appel
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${SPOTIFY_API_BASE}/playlists/playlist123`,
        {
          headers: { Authorization: "Bearer valid_token" },
        }
      );
      
      // FIX 1: Le résultat attendu doit être l'objet de données accumulé (tous les éléments)
      // On vérifie le format de base et que tous les items ont été accumulés
      expect(result.data.tracks.items.length).toBe(3);
      expect(result.data.id).toBe("playlist123");
      expect(result.error).toBeNull();
    });

    test("returns error if Spotify API returns error in response", async () => {
      const mockError = { error: { message: "Invalid playlist ID" } };
      globalThis.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockError),
      });

      const result = await fetchPlaylistById("valid_token", "bad_id");
      // Le message d'erreur est renvoyé directement par la fonction principale (non paginée) de l'API.
      expect(result).toEqual({
        error: "Invalid playlist ID",
        data: null,
      });
    });

    test("returns error if fetch throws", async () => {
      globalThis.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const result = await fetchPlaylistById("any_token", "playlist123");
      // FIX 2 & 3: Le message d'erreur doit correspondre à la chaîne française de l'API paginée
      expect(result).toEqual({
        error: "Échec de la récupération des pistes durant la pagination.",
        data: null,
      });
    });
  });
});