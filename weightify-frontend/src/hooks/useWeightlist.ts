import { useState, useEffect } from 'react';
import { Weightlist } from '../types';
import { getUserWeightlists, getWeightlist } from '../api/weightlist';

export const useUserWeightlists = () => {
  const [weightlists, setWeightlists] = useState<Weightlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchWeightlists = async () => {
      try {
        setLoading(true);
        const data = await getUserWeightlists();
        setWeightlists(data);
        setError(null);
      } catch (err) {
        setError('Failed to load weightlists');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeightlists();
  }, []);
  
  return { weightlists, loading, error };
};

export const useSingleWeightlist = (id: string) => {
  const [weightlist, setWeightlist] = useState<Weightlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchWeightlist = async () => {
      try {
        setLoading(true);
        const data = await getWeightlist(id);
        setWeightlist(data);
        setError(null);
      } catch (err) {
        setError('Failed to load weightlist');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchWeightlist();
    }
  }, [id]);
  
  return { weightlist, loading, error };
};