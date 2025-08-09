import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Box, Card, CardContent, IconButton, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Add, Delete, DragIndicator } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { weightflowApi } from '../../api/weightflow';
import { getUserWeightlists } from '../../api/weightlist';
import { Weightflow, WeightflowItem, Weightlist } from '../../types';

const WeightflowForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [weightlists, setWeightlists] = useState<WeightflowItem[]>([]);
  const [availableWeightlists, setAvailableWeightlists] = useState<Weightlist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableWeightlists();
    if (isEdit && id) {
      loadWeightflow(id);
    }
  }, [id, isEdit]);

  const loadAvailableWeightlists = async () => {
    try {
      const data = await getUserWeightlists();
      setAvailableWeightlists(data);
    } catch (error) {
      console.error('Error loading weightlists:', error);
    }
  };

  const loadWeightflow = async (weightflowId: string) => {
    try {
      const weightflow = await weightflowApi.getWeightflow(weightflowId);
      setName(weightflow.name);
      setWeightlists(weightflow.weightlists.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Error loading weightflow:', error);
    }
  };

  const addWeightlist = () => {
    if (weightlists.length >= 8) return;
    
    setWeightlists([...weightlists, {
      weightlistId: '',
      timeLimitMinutes: 30,
      order: weightlists.length
    }]);
  };

  const removeWeightlist = (index: number) => {
    const newWeightlists = weightlists.filter((_, i) => i !== index);
    setWeightlists(newWeightlists.map((w, i) => ({ ...w, order: i })));
  };

  const updateWeightlist = (index: number, field: keyof WeightflowItem, value: any) => {
    const newWeightlists = [...weightlists];
    newWeightlists[index] = { ...newWeightlists[index], [field]: value };
    setWeightlists(newWeightlists);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || weightlists.length === 0) return;

    setLoading(true);
    try {
      const weightflowData = {
        name: name.trim(),
        weightlists: weightlists.map((w, i) => ({
          ...w,
          order: i,
          timeLimitMinutes: i === weightlists.length - 1 ? undefined : w.timeLimitMinutes
        }))
      };

      if (isEdit && id) {
        await weightflowApi.updateWeightflow(id, weightflowData);
      } else {
        await weightflowApi.createWeightflow(weightflowData);
      }
      
      navigate('/weightflows');
    } catch (error) {
      console.error('Error saving weightflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeightlistName = (weightlistId: string) => {
    const weightlist = availableWeightlists.find(w => w._id === weightlistId);
    return weightlist?.name || 'Unknown Weightlist';
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {isEdit ? 'Edit Weightflow' : 'New Weightflow'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Weightflow Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Box>

        <Typography variant="h6" gutterBottom>
          Weightlists ({weightlists.length}/8)
        </Typography>

        {weightlists.map((weightlist, index) => (
          <Card key={index} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DragIndicator color="disabled" />
                
                <FormControl sx={{ minWidth: 200, flexGrow: 1 }}>
                  <InputLabel>Weightlist</InputLabel>
                  <Select
                    value={weightlist.weightlistId}
                    onChange={(e) => updateWeightlist(index, 'weightlistId', e.target.value)}
                    required
                  >
                    {availableWeightlists.map((w) => (
                      <MenuItem key={w._id} value={w._id}>
                        {w.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {index < weightlists.length - 1 && (
                  <TextField
                    type="number"
                    label="Time Limit (min)"
                    value={weightlist.timeLimitMinutes || ''}
                    onChange={(e) => updateWeightlist(index, 'timeLimitMinutes', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 1440 }}
                    sx={{ width: 150 }}
                    required
                  />
                )}

                <IconButton
                  color="error"
                  onClick={() => removeWeightlist(index)}
                  disabled={weightlists.length === 1}
                >
                  <Delete />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))}

        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={addWeightlist}
            disabled={weightlists.length >= 8}
          >
            Add Weightlist
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !name.trim() || weightlists.length === 0}
          >
            {loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')} Weightflow
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/weightflows')}
          >
            Cancel
          </Button>
        </Box>
      </form>
    </Container>
  );
};

export default WeightflowForm;