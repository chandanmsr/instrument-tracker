import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Check if we're in production or local
const isProduction = process.env.NODE_ENV === 'production';
const isLocalStorageAvailable = typeof window !== 'undefined' && window.localStorage;

// Create Supabase client (if credentials exist)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper function to calculate next calibration date
function calculateNextCalibrationDate(lastDate, period) {
  if (!lastDate) return null;
  const date = new Date(lastDate);
  date.setDate(date.getDate() + (period || 30));
  return date.toISOString().split('T')[0];
}

// Storage key for localStorage
const STORAGE_KEY = 'instrument_tracker_data';

// Local storage functions
const localStorageDB = {
  getInstruments: () => {
    if (!isLocalStorageAvailable) {
      console.warn('localStorage not available');
      return [];
    }
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data).instruments || [] : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },
  
  saveInstrument: (instrument) => {
    if (!isLocalStorageAvailable) return instrument;
    
    try {
      const data = localStorage.getItem(STORAGE_KEY) || '{"instruments":[]}';
      const parsed = JSON.parse(data);
      const newInstrument = {
        ...instrument,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        next_calibration_date: instrument.last_calibration_date ? 
          calculateNextCalibrationDate(instrument.last_calibration_date, instrument.calibration_period) : null,
        status: instrument.last_calibration_date ? 'ready' : 'not_ready'
      };
      
      parsed.instruments.push(newInstrument);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return newInstrument;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return instrument;
    }
  },
  
  updateCalibration: (id, updateData) => {
    if (!isLocalStorageAvailable) return null;
    
    try {
      const data = localStorage.getItem(STORAGE_KEY) || '{"instruments":[]}';
      const parsed = JSON.parse(data);
      const index = parsed.instruments.findIndex(inst => inst.id === id);
      
      if (index !== -1) {
        const updatedInstrument = {
          ...parsed.instruments[index],
          ...updateData,
          updated_at: new Date().toISOString(),
          next_calibration_date: updateData.last_calibration_date ? 
            calculateNextCalibrationDate(
              updateData.last_calibration_date,
              parsed.instruments[index].calibration_period
            ) : null,
          status: 'ready'
        };
        
        parsed.instruments[index] = updatedInstrument;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        return updatedInstrument;
      }
      return null;
    } catch (error) {
      console.error('Error updating localStorage:', error);
      return null;
    }
  },
  
  getInstrument: (id) => {
    if (!isLocalStorageAvailable) return null;
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data);
      return parsed.instruments.find(inst => inst.id === id);
    } catch (error) {
      console.error('Error getting instrument from localStorage:', error);
      return null;
    }
  },
  
  deleteInstrument: (id) => {
    if (!isLocalStorageAvailable) return null;
    
    try {
      const data = localStorage.getItem(STORAGE_KEY) || '{"instruments":[]}';
      const parsed = JSON.parse(data);
      const instrumentToDelete = parsed.instruments.find(inst => inst.id === id);
      parsed.instruments = parsed.instruments.filter(inst => inst.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return instrumentToDelete;
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
      return null;
    }
  }
};

// Try Supabase first, fallback to localStorage
export const database = {
  // Get all instruments
  async getInstruments() {
    // Try Supabase first
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('instruments')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          return data;
        }
      } catch (error) {
        console.log('Supabase fetch failed, using localStorage:', error.message);
      }
    }
    
    // Fallback to localStorage
    return localStorageDB.getInstruments();
  },

  // Get single instrument
  async getInstrument(id) {
    // Try Supabase first
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('instruments')
          .select('*')
          .eq('id', id)
          .single();
        
        if (!error && data) {
          return data;
        }
      } catch (error) {
        console.log('Supabase fetch failed for single instrument:', error.message);
      }
    }
    
    // Fallback to localStorage
    return localStorageDB.getInstrument(id);
  },

  // Add new instrument
  async addInstrument(instrumentData) {
    // Try Supabase first
    if (supabase) {
      try {
        const nextCalibration = calculateNextCalibrationDate(
          instrumentData.last_calibration_date,
          instrumentData.calibration_period
        );

        const { data, error } = await supabase
          .from('instruments')
          .insert([{
            ...instrumentData,
            next_calibration_date: nextCalibration,
            status: instrumentData.last_calibration_date ? 'ready' : 'not_ready',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();
        
        if (!error && data) {
          return data;
        }
      } catch (error) {
        console.log('Supabase insert failed, using localStorage:', error.message);
      }
    }
    
    // Fallback to localStorage
    return localStorageDB.saveInstrument(instrumentData);
  },

  // Update calibration
  async updateCalibration(id, updateData) {
    // Try Supabase first
    if (supabase) {
      try {
        const instrument = await this.getInstrument(id);
        if (!instrument) throw new Error('Instrument not found');

        const nextCalibration = calculateNextCalibrationDate(
          updateData.last_calibration_date,
          instrument.calibration_period
        );

        const { data, error } = await supabase
          .from('instruments')
          .update({
            ...updateData,
            next_calibration_date: nextCalibration,
            status: 'ready',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();
        
        if (!error && data) {
          return data;
        }
      } catch (error) {
        console.log('Supabase update failed, using localStorage:', error.message);
      }
    }
    
    // Fallback to localStorage
    return localStorageDB.updateCalibration(id, updateData);
  },

  // Delete instrument
  async deleteInstrument(id) {
    // Try Supabase first
    if (supabase) {
      try {
        const { error } = await supabase
          .from('instruments')
          .delete()
          .eq('id', id);
        
        if (!error) {
          return true;
        }
      } catch (error) {
        console.log('Supabase delete failed, using localStorage:', error.message);
      }
    }
    
    // Fallback to localStorage
    return localStorageDB.deleteInstrument(id);
  }
};

// Function to check if Supabase is connected
export const checkSupabaseConnection = async () => {
  if (!supabase) {
    return { connected: false, message: 'Supabase not configured' };
  }
  
  try {
    const { data, error } = await supabase.from('instruments').select('count');
    return {
      connected: !error,
      message: error ? 'Connection failed: ' + error.message : 'Connected successfully'
    };
  } catch (error) {
    return {
      connected: false,
      message: 'Connection error: ' + error.message
    };
  }
};