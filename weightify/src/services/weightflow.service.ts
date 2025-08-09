import { Weightflow, IWeightflow } from '../models/weightflow.model';
import { Weightlist } from '../models/weightlist.model';
import { Session } from '../models/session.model';
import weightlistService from './weightlist.service';
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

    const firstWeightlist = weightflow.weightlists.sort((a, b) => a.order - b.order)[0];
    
    // Delete ALL existing sessions and tracks for this user to ensure complete reset
    await Session.deleteMany({ userId });
    const { Track } = await import('../models/track.model');
    await Track.deleteMany({ weightlistId: firstWeightlist.weightlistId });
    
    // Create session for the first weightlist
    const { session, firstTrack } = await weightlistService.startPlaybackSession(
      firstWeightlist.weightlistId,
      userId,
      accessToken
    );

    // Update the session with weightflow info
    session.weightflowId = weightflowId;
    session.currentWeightlistIndex = 0;
    session.timeLimitMinutes = firstWeightlist.timeLimitMinutes;
    await session.save();

    return { sessionId: session.sessionId, firstTrack, weightflow };
  }

  async getNextWeightflowTrack(weightflowId: string, sessionId: string, accessToken: string) {
    const session = await Session.findOne({ sessionId });
    if (!session) throw new Error('Session not found');

    const weightflow = await Weightflow.findById(weightflowId);
    if (!weightflow) throw new Error('Weightflow not found');

    // Check if time limit exceeded and switch to next weightlist
    if (this.shouldSwitchWeightlist(session)) {
      return await this.switchToNextWeightlist(weightflow, session, accessToken);
    }

    // Get next track from current weightlist using the weightflow session
    const track = await weightlistService.getNextTrack(session.weightlistId, sessionId, accessToken);
    return track;
  }

  private shouldSwitchWeightlist(session: any): boolean {
    if (!session.timeLimitMinutes || !session.startTime) return false;
    
    const elapsed = (Date.now() - session.startTime.getTime()) / (1000 * 60);
    return elapsed >= session.timeLimitMinutes;
  }

  private async switchToNextWeightlist(weightflow: IWeightflow, session: any, accessToken: string) {
    const sortedWeightlists = weightflow.weightlists.sort((a, b) => a.order - b.order);
    const nextIndex = (session.currentWeightlistIndex || 0) + 1;
    
    if (nextIndex >= sortedWeightlists.length) {
      throw new Error('Weightflow completed');
    }

    const nextWeightlist = sortedWeightlists[nextIndex];
    
    // Update session
    session.weightlistId = nextWeightlist.weightlistId;
    session.currentWeightlistIndex = nextIndex;
    session.startTime = new Date();
    session.timeLimitMinutes = nextWeightlist.timeLimitMinutes;
    await session.save();

    // Start new weightlist session
    const { firstTrack } = await weightlistService.startPlaybackSession(
      nextWeightlist.weightlistId,
      weightflow.userId,
      accessToken
    );

    return firstTrack;
  }
}

export default new WeightflowService();