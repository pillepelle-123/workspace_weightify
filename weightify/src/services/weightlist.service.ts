import { Weightlist, IWeightlist } from '../models/weightlist.model';
import { Track, ITrack } from '../models/track.model';
import { Session, ISession } from '../models/session.model';
import { v4 as uuidv4 } from 'uuid';
import spotifyService from './spotify.service';
import { differenceInMinutes } from 'date-fns';
import logger from '../utils/logger';

class WeightlistService {
  async createWeightlist(weightlistData: any, userId: string): Promise<IWeightlist> {
    // Validate weights sum to 100%
    const totalWeight = weightlistData.sourcePlaylists.reduce(
      (sum: number, playlist: any) => sum + playlist.weight, 
      0
    );
    
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error('Total weights must sum to 100%');
    }
    
    // Validate scheduled weight changes
    if (weightlistData.scheduledWeightChanges) {
      for (const change of weightlistData.scheduledWeightChanges) {
        const newTotalWeight = change.newWeights.reduce(
          (sum: number, weight: any) => sum + weight.weight, 
          0
        );
        
        if (Math.abs(newTotalWeight - 100) > 0.01) {
          throw new Error('Scheduled weight changes must sum to 100%');
        }
      }
    }
    
    const weightlist = new Weightlist({
      ...weightlistData,
      userId
    });
    
    await weightlist.save();
    return weightlist;
  }
  
  async updateWeights(
    weightlistId: string, 
    newWeights: { playlistId: string; weight: number }[], 
    userId: string
  ): Promise<IWeightlist> {
    // Validate total weight is 100%
    const totalWeight = newWeights.reduce((sum, w) => sum + w.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error('Total weights must sum to 100%');
    }
    
    const weightlist = await Weightlist.findOne({ _id: weightlistId, userId });
    
    if (!weightlist) {
      throw new Error('Weightlist not found');
    }
    
    weightlist.sourcePlaylists = newWeights;
    await weightlist.save();
    
    return weightlist;
  }

  async startPlaybackSession(
    weightlistId: string,
    userId: string,
    accessToken: string
  ): Promise<{ session: ISession; firstTrack: any }> {
    // Create a new session
    const sessionId = uuidv4();
    const session = new Session({
      sessionId,
      weightlistId,
      userId,
      startTime: new Date(),
      lastActivityTime: new Date()
    });
    
    await session.save();
    
    // Get the weightlist
    const weightlist = await Weightlist.findById(weightlistId);
    if (!weightlist) {
      throw new Error('Weightlist not found');
    }
    
    // Load all tracks from source playlists
    await this.loadTracksForSession(weightlist, sessionId, accessToken);
    
    // Get first track based on playback mode
    const firstTrack = await this.getNextTrack(weightlistId, sessionId, accessToken);
    
    return { session, firstTrack };
  }
  
  private async loadTracksForSession(
    weightlist: IWeightlist,
    sessionId: string,
    accessToken: string
  ): Promise<void> {
    for (const sourcePlaylist of weightlist.sourcePlaylists) {
      const tracks = await spotifyService.getPlaylistTracks(
        accessToken,
        sourcePlaylist.playlistId
      );
      
      // Save complete track info to database
      const trackDocs = tracks.map((track: any) => ({
        trackId: track.id,
        name: track.name,
        uri: track.uri,
        artists: track.artists || [],
        album: track.album || {},
        artistNames: typeof track.artists === 'string' ? track.artists : (track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist'),
        albumName: typeof track.album === 'string' ? track.album : (track.album?.name || 'Unknown Album'),
        albumCoverUrl: (typeof track.album === 'object' && track.album?.images?.[0]?.url) || '',
        duration_ms: track.duration_ms || 0,
        weightlistId: weightlist._id,
        playlistId: sourcePlaylist.playlistId,
        isPlayed: false,
        sessionId
      }));
      
      if (trackDocs.length > 0) {
        await Track.insertMany(trackDocs);
      }
    }
  }
  
  async getNextTrack(
    weightlistId: string,
    sessionId: string,
    accessToken: string
  ): Promise<any> {
    // Get the session and weightlist
    const session = await Session.findOne({ sessionId });
    if (!session) {
      throw new Error('Session not found');
    }
    
    const weightlist = await Weightlist.findById(weightlistId);
    if (!weightlist) {
      throw new Error('Weightlist not found');
    }
    
    // Check if we need to apply scheduled weight changes
    await this.applyScheduledWeightChanges(weightlist, session);
    
    // Get tracks based on current weights and playback mode
    let nextTrack;
    
    if (weightlist.singlePlaylistMode && session.currentPlaylistId) {
      // In single playlist mode, only get tracks from the selected playlist
      nextTrack = await this.getNextTrackFromSinglePlaylist(
        weightlistId, 
        sessionId, 
        session.currentPlaylistId,
        weightlist.playbackMode
      );
    } else {
      // Use weighted selection based on playlist weights
      nextTrack = await this.getWeightedTrack(weightlistId, sessionId, weightlist);
    }
    
    if (!nextTrack) {
      // If all tracks played, check repeat mode
      if (weightlist.repeatMode === 'entire_weightlist') {
        await Track.updateMany(
          { weightlistId, sessionId },
          { isPlayed: false }
        );
        return this.getNextTrack(weightlistId, sessionId, accessToken);
      }
      throw new Error('No more tracks available for playback');
    }
    
    // Mark track as played
    await Track.findByIdAndUpdate(nextTrack._id, { isPlayed: true });
    
    // Update session
    session.lastActivityTime = new Date();
    await session.save();
    
    // Get full track details from Spotify
    const trackDetails = await spotifyService.getTrack(accessToken, nextTrack.trackId);
    
    // Get playlist name
    let playlistName = 'Unknown Playlist';
    try {
      const playlist = await spotifyService.getPlaylist(accessToken, nextTrack.playlistId);
      playlistName = playlist.name;
    } catch (error) {
      logger.error(`Failed to fetch playlist name for ${nextTrack.playlistId}:`, error);
    }
    
    return {
      ...trackDetails,
      isPlayed: true,
      playlistId: nextTrack.playlistId,
      playlistName,
      crossfadeDuration: weightlist.crossfadeDuration
    };
  }
  
  private async applyScheduledWeightChanges(
    weightlist: IWeightlist,
    session: ISession
  ): Promise<void> {
    if (!weightlist.scheduledWeightChanges || weightlist.scheduledWeightChanges.length === 0) {
      return;
    }
    
    const sessionDurationMinutes = differenceInMinutes(
      new Date(),
      session.startTime
    );
    
    // Find the appropriate weight change to apply
    let appliedChange = null;
    
    for (const change of weightlist.scheduledWeightChanges) {
      if (sessionDurationMinutes >= change.afterMinutes) {
        if (!appliedChange || change.afterMinutes > appliedChange.afterMinutes) {
          appliedChange = change;
        }
      }
    }
    
    if (appliedChange) {
      // Apply the weight change
      weightlist.sourcePlaylists = appliedChange.newWeights.map(w => ({
        playlistId: w.playlistId,
        weight: w.weight
      }));
      
      await weightlist.save();
    }
  }
  
  private async getNextTrackFromSinglePlaylist(
    weightlistId: string,
    sessionId: string,
    playlistId: string,
    playbackMode: string
  ): Promise<ITrack | null> {
    const query = {
      weightlistId,
      sessionId,
      playlistId,
      isPlayed: false
    };
    
    if (playbackMode === 'default') {
      // In default mode, get tracks in original playlist order
      // (simplified here - would need actual playlist ordering)
      return Track.findOne(query);
    } else {
      // In shuffle mode, get a random track
      const count = await Track.countDocuments(query);
      if (count === 0) return null;
      
      const random = Math.floor(Math.random() * count);
      return Track.findOne(query).skip(random);
    }
  }
  
  private async getWeightedTrack(
    weightlistId: string,
    sessionId: string,
    weightlist: IWeightlist
  ): Promise<ITrack | null> {
    // Get a random number between 0 and 100
    const random = Math.random() * 100;
    
    // Cumulative weight
    let cumulativeWeight = 0;
    
    // Find the playlist based on weight distribution
    for (const playlist of weightlist.sourcePlaylists) {
      cumulativeWeight += playlist.weight;
      
      if (random <= cumulativeWeight) {
        // Found the playlist, now get a track from it
        const query = {
          weightlistId,
          sessionId,
          playlistId: playlist.playlistId,
          isPlayed: false
        };
        
        if (weightlist.playbackMode === 'shuffle') {
          // Get a random track from this playlist
          const count = await Track.countDocuments(query);
          if (count === 0) continue; // No unplayed tracks in this playlist
          
          const randomIndex = Math.floor(Math.random() * count);
          return Track.findOne(query).skip(randomIndex);
        } else {
          // Get the next track in order
          return Track.findOne(query);
        }
      }
    }
    
    // Fallback: if no track found by weights, try to find any unplayed track
    return Track.findOne({
      weightlistId,
      sessionId,
      isPlayed: false
    });
  }
  
  async resetPlaybackSession(weightlistId: string, sessionId: string): Promise<void> {
    await Track.updateMany(
      { weightlistId, sessionId },
      { isPlayed: false }
    );
    
    // Update session
    const session = await Session.findOne({ sessionId });
    if (session) {
      session.lastActivityTime = new Date();
      await session.save();
    }
  }
  
  async getAllTracks(
    weightlistId: string,
    sessionId: string
  ): Promise<ITrack[]> {
    return Track.find({ weightlistId, sessionId });
  }
  
  async getAllTracksWithDetails(
    weightlistId: string,
    sessionId: string,
    accessToken: string
  ): Promise<any[]> {
    logger.info(`getAllTracksWithDetails called for weightlist: ${weightlistId}, session: ${sessionId}`);
    const tracks = await Track.find({ weightlistId, sessionId });
    logger.info(`Found ${tracks.length} tracks in database`);
    const weightlist = await Weightlist.findById(weightlistId);
    logger.info(`Weightlist found:`, weightlist ? 'yes' : 'no');
    
    // Create playlist name mapping
    const playlistNames: Record<string, string> = {};
    if (weightlist) {
      for (const sourcePlaylist of weightlist.sourcePlaylists) {
        try {
          const playlist = await spotifyService.getPlaylist(accessToken, sourcePlaylist.playlistId);
          playlistNames[sourcePlaylist.playlistId] = playlist.name;
          logger.info(`Successfully fetched playlist: ${sourcePlaylist.playlistId} -> ${playlist.name}`);
        } catch (error) {
          logger.error(`Failed to fetch playlist name for ${sourcePlaylist.playlistId}:`, error);
          playlistNames[sourcePlaylist.playlistId] = 'Unknown Playlist';
        }
      }
    }
    logger.info('Playlist names mapping:', playlistNames);
    
    // Use stored track data with playlist names
    const tracksWithDetails = tracks.map(track => {
      const playlistName = playlistNames[track.playlistId] || 'Unknown Playlist';
      return {
        id: track.trackId,
        name: track.name,
        uri: track.uri,
        artists: [{ name: track.artistNames || 'Unknown Artist' }],
        album: { 
          name: track.albumName || 'Unknown Album',
          images: track.albumCoverUrl ? [{ url: track.albumCoverUrl }] : []
        },
        duration_ms: track.duration_ms || 0,
        isPlayed: track.isPlayed,
        playlistId: track.playlistId,
        playlistName
      };
    });
    
    return tracksWithDetails;
  }
}

export default new WeightlistService();