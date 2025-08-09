import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, CardActions, Button, Box, IconButton } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { PlayArrow, Edit, Delete } from '@mui/icons-material';
import { weightflowApi } from '../../api/weightflow';
import { Weightflow } from '../../types';

const WeightflowList: React.FC = () => {
  const [weightflows, setWeightflows] = useState<Weightflow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadWeightflows();
  }, []);

  const loadWeightflows = async () => {
    try {
      const data = await weightflowApi.getWeightflows();
      setWeightflows(data);
    } catch (error) {
      console.error('Error loading weightflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this weightflow?')) {
      try {
        await weightflowApi.deleteWeightflow(id);
        setWeightflows(weightflows.filter(w => w._id !== id));
      } catch (error) {
        console.error('Error deleting weightflow:', error);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">My Weightflows</Typography>
        <Button
          variant="contained"
          component={RouterLink}
          to="/weightflows/new"
          sx={{ borderRadius: 3 }}
        >
          New Weightflow
        </Button>
      </Box>

      {weightflows.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No weightflows created yet. Create your first weightflow to get started!
        </Typography>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)' 
          }, 
          gap: 3 
        }}>
          {weightflows.map((weightflow) => (
            <Box key={weightflow._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {weightflow.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {weightflow.weightlists.length} weightlist{weightflow.weightlists.length !== 1 ? 's' : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Created {new Date(weightflow.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton
                    color="primary"
                    onClick={() => navigate(`/weightflows/${weightflow._id}`)}
                  >
                    <PlayArrow />
                  </IconButton>
                  <IconButton
                    color="secondary"
                    component={RouterLink}
                    to={`/weightflows/${weightflow._id}/edit`}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(weightflow._id)}
                  >
                    <Delete />
                  </IconButton>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default WeightflowList;