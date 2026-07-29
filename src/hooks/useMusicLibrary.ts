import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { musicApi } from "@/api/music";
import { queryKeys } from "@/lib/queryKeys";
import type { PlaylistDetail, TrackInput } from "@/types/music";

/** Append tracks to a playlist, leaving what is already in it alone. */
export function useAppendPlaylistTracks(playlistId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tracks: TrackInput[]) =>
      musicApi.appendTracks(playlistId, tracks),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.music.playlist(playlistId) });
      qc.invalidateQueries({ queryKey: queryKeys.music.playlists() });
    },
  });
}

/** Import a playlist link. The source's own name is used unless one is given. */
export function useImportPlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      url: string;
      name?: string | null;
      is_public: boolean;
    }) => musicApi.importPlaylist(body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.music.playlists() }),
  });
}

export function useCreatePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; is_public: boolean }) =>
      musicApi.createPlaylist({ ...body, tracks: [] }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.music.playlists() }),
  });
}

export function useUpdatePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: number;
      name?: string;
      is_public?: boolean;
    }): Promise<PlaylistDetail> => musicApi.updatePlaylist(id, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.music.playlists() }),
  });
}

/**
 * Rewrite a playlist's whole track list.
 *
 * Wholesale rather than per-row edits because that is what the API takes: it
 * keeps positions contiguous without a renumbering pass, so a reorder and a
 * removal are the same call.
 */
export function useReplacePlaylistTracks(playlistId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tracks: TrackInput[]) =>
      musicApi.replaceTracks(playlistId, tracks),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.music.playlist(playlistId) });
      qc.invalidateQueries({ queryKey: queryKeys.music.playlists() });
    },
  });
}

export function useDeletePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => musicApi.deletePlaylist(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.music.playlists() }),
  });
}

/**
 * Append to a playlist chosen at click time rather than at hook time.
 *
 * Distinct from `useAppendPlaylistTracks`, which binds one id: a dialog that
 * lists playlists does not know which one it is adding to until it is pressed.
 */
export function useAppendTracksTo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      playlistId,
      tracks,
    }: {
      playlistId: number;
      tracks: TrackInput[];
    }) => musicApi.appendTracks(playlistId, tracks),
    onSuccess: (_data, { playlistId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.music.playlist(playlistId) });
      qc.invalidateQueries({ queryKey: queryKeys.music.playlists() });
    },
  });
}

/** Create a playlist with tracks already in it - a saved queue, or one track. */
export function useCreatePlaylistWithTracks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      is_public,
      tracks,
    }: {
      name: string;
      is_public: boolean;
      tracks: TrackInput[];
    }) => musicApi.createPlaylist({ name, is_public, tracks }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.music.playlists() }),
  });
}

export function useMusicPlaylists(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.music.playlists(),
    queryFn: () => musicApi.listPlaylists("all"),
    enabled,
  });
}

export function useMusicPlaylist(playlistId: number | null) {
  return useQuery({
    queryKey: queryKeys.music.playlist(playlistId ?? 0),
    queryFn: () => musicApi.getPlaylist(playlistId as number),
    enabled: playlistId !== null,
  });
}
