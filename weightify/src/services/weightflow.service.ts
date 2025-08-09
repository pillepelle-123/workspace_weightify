import { Weightflow, IWeightflow } from '../models/weightflow.model';
import { Weightlist } from '../models/weightlist.model';
import { Session } from '../models/session.model';
import weightlistService from './weightlist.service';
import spotifyService from './spotify.service';
import { v4 as uuidv4 } from 'uuid';

class WeightflowService {
  async createWeightflow(data: any, userId: string): Promise<IWeightflow> {
    const weightflow = new Weightflow({
      ...data,
      userId
    });
    return await weightflow.save();
  }

  async getUserWeightflows(userId: string): Promise<IWeightflow[]> {
    return await Weightflow.find({ userId });
  }

  async getWeightflow(id: string, userId: string): Promise<IWeightflow | null> {
    return await Weightflow.findOne({ _id: id, userId });
  }

  async updateWeightflow(id: string, data: any, userId: string): Promise<IWeightflow | null> {
    return await Weightflow.findOneAndUpdate(
      { _id: id, userId },
      data,
      { new: true }
    );
  }

  async deleteWeightflow(id: string, userId: string): Promise<boolean> {
    const result = await Weightflow.findOneAndDelete({ _id: id, userId });
    return !!result;
  }

  async startWeightflowSession(weightflowId: string, userId: string, accessToken: string) {
    const weightflow = await this.getWeightflow(weightflowId, userId);
    if (!weightflow || weightflow.weightlists.length === 0) {
      throw new Error('Weightflow not found or empty');
    }

    const sortedWeightlists = weightflow.weightlists.sort((a, b) => a.order - b.order);
    const firstWeightlist = sortedWeightlists[0];
    
    // Clean up existing sessions
    await Session.deleteMany({ userId });
    
    // Create weightflow session
    const sessionId = uuidv4();
    const session = new Session({
      sessionId,
      weightlistId: firstWeightlist.weightlistId,
      userId,
      startTime: new Date(),
      lastActivityTime: new Date(),
      weightflowId,
      currentWeightlistIndex: 0,
      timeLimitMinutes: firstWeightlist.timeLimitMinutes
    });
    await session.save();

    // Load tracks for first weightlist
    const weightlist = await Weightlist.findById(firstWeightlist.weightlistId);
    if (!weightlist) throw new Error('Weightlist not found');
    
    await this.loadTracksForWeightlist(weightlist, sessionId, accessToken);
    
    // Get first track
    const firstTrack = await weightlistService.getNextTrack(
      firstWeightlist.weightlistId,
      sessionId,
      accessToken
    );

    return { sessionId, firstTrack, weightflow };
  }

  async getNextWeightflowTrack(weightflowId: string, sessionId: string, accessToken: string) {
    const session = await Session.findOne({ sessionId });
    if (!session) throw new Error('Session not found');

    const weightflow = await Weightflow.findById(weightflowId);
    if (!weightflow) throw new Error('Weightflow not found');

    const sortedWeightlists = weightflow.weightlists.sort((a, b) => a.order - b.order);
    const currentIndex = session.currentWeightlistIndex || 0;
    const isLastWeightlist = currentIndex >= sortedWeightlists.length - 1;

    // Check if marked to switch to next weightlist
    if (this.shouldSwitchWeightlist(session)) {
      session.shouldSwitchToNext = false;
      await session.save();
      return await this.switchToNextWeightlist(weightflow, session, accessToken);
    }

    // Check if time limit exceeded (but don't switch yet)
    if (!isLastWeightlist && session.timeLimitMinutes && session.startTime) {
      const elapsed = (Date.now() - session.startTime.getTime()) / (1000 * 60);
      if (elapsed >= session.timeLimitMinutes) {
        // Mark for switch after current track ends
        session.shouldSwitchToNext = true;
        await session.save();
      }
    }

    // Try to get next track from current weightlist
    try {
      const track = await weightlistService.getNextTrack(session.weightlistId, sessionId, accessToken);
      return track;
    } catch (error: any) {
      // If no tracks available and not last weightlist, switch immediately
      if (!isLastWeightlist && error.message.includes('No more tracks available')) {
        return await this.switchToNextWeightlist(weightflow, session, accessToken);
      }
      throw error;
    }
  }

  private shouldSwitchWeightlist(session: any): boolean {
    // Only switch when explicitly marked, not based on time
    return session.shouldSwitchToNext === true;
  }

  private async switchToNextWeightlist(weightflow: IWeightflow, session: any, accessToken: string) {
    const sortedWeightlists = weightflow.weightlists.sort((a, b) => a.order - b.order);
    const nextIndex = (session.currentWeightlistIndex || 0) + 1;
    
    if (nextIndex >= sortedWeightlists.length) {
      throw new Error('Weightflow completed');
    }

    const nextWeightlist = sortedWeightlists[nextIndex];
    const isLastWeightlist = nextIndex >= sortedWeightlists.length - 1;
    
    // Clear tracks for this session
    const { Track } = await import('../models/track.model');
    await Track.deleteMany({ sessionId: session.sessionId });
    
    // Update session
    session.weightlistId = nextWeightlist.weightlistId;
    session.currentWeightlistIndex = nextIndex;
    session.startTime = new Date();
    session.timeLimitMinutes = isLastWeightlist ? null : nextWeightlist.timeLimitMinutes;
    session.shouldSwitchToNext = false;
    await session.save();

    // Load tracks for new weightlist
    const weightlist = await Weightlist.findById(nextWeightlist.weightlistId);
    if (!weightlist) throw new Error('Weightlist not found');
    
    await this.loadTracksForWeightlist(weightlist, session.sessionId, accessToken);
    
    // Get first track
    const firstTrack = await weightlistService.getNextTrack(
      nextWeightlist.weightlistId,
      session.sessionId,
      accessToken
    );

    return firstTrack;
  }
  
  private async loadTracksForWeightlist(
    weightlist: any,
    sessionId: string,
    accessToken: string
  ): Promise<void> {
    for (const sourcePlaylist of weightlist.sourcePlaylists) {
      const tracks = await spotifyService.getPlaylistTracks(
        accessToken,
        sourcePlaylist.playlistId
      );
      
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
        const { Track } = await import('../models/track.model');
        await Track.insertMany(trackDocs);
      }
    }
  }
}

export default new WeightflowService();