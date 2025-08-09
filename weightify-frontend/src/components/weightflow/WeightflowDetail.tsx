import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, Card, CardContent, Chip, LinearProgress } from '@mui/material';
import { PlayArrow, Edit } from '@mui/icons-material';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { weightflowApi } from '../../api/weightflow';
import { getWeightlist } from '../../api/weightlist';
import { Weightflow, Weightlist } from '../../types';
import WeightflowPlayer from './WeightflowPlayer';
import { usePlayer } from '../../hooks/usePlayer';
import { trackCache } from '../player/TrackList';

const WeightflowDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [weightflow, setWeightflow] = useState<Weightflow | null>(null);
  const [weightlistDetails, setWeightlistDetails] = useState<{ [key: string]: Weightlist }>({});
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [firstTrack, setFirstTrack] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadWeightflow(id);
    }
  }, [id]);

  const loadWeightflow = async (weightflowId: string) => {
    try {
      const weightflowData = await weightflowApi.getWeightflow(weightflowId);
      setWeightflow(weightflowData);
      
      // Load weightlist details
      const details: { [key: string]: Weightlist } = {};
      for (const item of weightflowData.weightlists) {
        try {
          const weightlist = await getWeightlist(item.weightlistId);
          details[item.weightlistId] = weightlist;
        } catch (error) {
          console.error(`Error loading weightlist ${item.weightlistId}:`, error);
        }
      }
      setWeightlistDetails(details);
    } catch (error) {
      console.error('Error loading weightflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const player = usePlayer();

  const handlePlay = async () => {
    if (!id) return;
    
    try {
      // Start with first weightlist
      const firstWeightlist = sortedWeightlists[0];
      
      // Store weightflow info in sessionStorage
      sessionStorage.setItem('currentWeightflowId', id);
      sessionStorage.setItem('currentWeightflowIndex', '0');
      
      // Navigate to first weightlist with weightflow context
      navigate(`/weightlists/${firstWeightlist.weightlistId}?weightflowId=${id}&weightflowIndex=0`);
    } catch (error) {
      console.error('Error starting weightflow:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!weightflow) return <div>Weightflow not found</div>;

  if (isPlaying && sessionId) {
    return <WeightflowPlayer weightflow={weightflow} sessionId={sessionId} weightlistDetails={weightlistDetails} firstTrack={firstTrack} />;
  }

  const sortedWeightlists = weightflow.weightlists.sort((a, b) => a.order - b.order);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {weightflow.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            component={RouterLink}
            to={`/weightflows/${weightflow._id}/edit`}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={handlePlay}
            size="large"
          >
            Play Weightflow
          </Button>
        </Box>
      </Box>

      <Typography variant="h6" gutterBottom>
        Weightlists ({sortedWeightlists.length})
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sortedWeightlists.map((item, index) => {
          const weightlist = weightlistDetails[item.weightlistId];
          const isLast = index === sortedWeightlists.length - 1;
          
          return (
            <Card key={item.weightlistId}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip label={index + 1} color="primary" size="small" />
                    <Typography variant="h6">
                      {weightlist?.name || 'Loading...'}
                    </Typography>
                  </Box>
                  
                  {!isLast && (
                    <Chip 
                      label={`${item.timeLimitMinutes} min`} 
                      variant="outlined" 
                      color="secondary"
                    />
                  )}
                </Box>
                
                {weightlist && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {weightlist.sourcePlaylists.length} source playlist{weightlist.sourcePlaylists.length !== 1 ? 's' : ''}
                  </Typography>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Created {new Date(weightflow.createdAt).toLocaleDateString()}
        </Typography>
      </Box>
    </Container>
  );
};

export default WeightflowDetail;