import { createClient } from '@supabase/supabase-js';

// For testing without Supabase, we'll use localStorage
// Remove this when you set up real Supabase

// Local storage simulation
const localStorageDB = {
  getInstruments: () => {
    const data = localStorage.getItem('instruments');
    return data ? JSON.parse(data) : [];
  },
  
  saveInstrument: (instrument) => {
    const instruments = localStorageDB.getInstruments();
    const newInstrument = {
      ...instrument,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      next_calibration_date: instrument.last_calibration_date ? 
        new Date(new Date(instrument.last_calibration_date).getTime() + 
          instrument.calibration_period * 24 * 60 * 60 * 1000
        ).toISOString().split('T')[0] : null,
      status: instrument.last_calibration_date ? 'ready' : 'not_ready'
    };
    
    instruments.push(newInstrument);
    localStorage.setItem('instruments', JSON.stringify(instruments));
    return newInstrument;
  },
  
  updateCalibration: (id, updateData) => {
    const instruments = localStorageDB.getInstruments();
    const index = instruments.findIndex(inst => inst.id === id);
    
    if (index !== -1) {
      instruments[index] = {
        ...instruments[index],
        ...updateData,
        updated_at: new Date().toISOString(),
        next_calibration_date: updateData.last_calibration_date ? 
          new Date(new Date(updateData.last_calibration_date).getTime() + 
            instruments[index].calibration_period * 24 * 60 * 60 * 1000
          ).toISOString().split('T')[0] : null,
        status: 'ready'
      };
      
      localStorage.setItem('instruments', JSON.stringify(instruments));
      return instruments[index];
    }
    return null;
  },
  
  getInstrument: (id) => {
    const instruments = localStorageDB.getInstruments();
    return instruments.find(inst => inst.id === id);
  },
  
  updateInstrument: (id, updates) => {
    const instruments = localStorageDB.getInstruments();
    const index = instruments.findIndex(inst => inst.id === id);
    
    if (index !== -1) {
      instruments[index] = {
        ...instruments[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem('instruments', JSON.stringify(instruments));
      return instruments[index];
    }
    return null;
  },
  
  deleteInstrument: (id) => {
    const instruments = localStorageDB.getInstruments();
    const instrumentToDelete = instruments.find(inst => inst.id === id);
    const updatedInstruments = instruments.filter(inst => inst.id !== id);
    
    localStorage.setItem('instruments', JSON.stringify(updatedInstruments));
    return instrumentToDelete;
  }
};

// Helper function to calculate next calibration date
function calculateNextCalibrationDate(lastDate, period) {
  if (!lastDate) return null;
  const date = new Date(lastDate);
  date.setDate(date.getDate() + (period || 30));
  return date.toISOString().split('T')[0];
}

// Export database functions
export const database = {
  // Get all instruments
  async getInstruments() {
    return localStorageDB.getInstruments();
  },

  // Get single instrument by ID
  async getInstrument(id) {
    return localStorageDB.getInstrument(id);
  },

  // Add new instrument
  async addInstrument(instrumentData) {
    return localStorageDB.saveInstrument(instrumentData);
  },

  // Update instrument calibration
  async updateCalibration(id, updateData) {
    return localStorageDB.updateCalibration(id, updateData);
  },

  // Update any instrument field
  async updateInstrument(id, updates) {
    return localStorageDB.updateInstrument(id, updates);
  },

  // Delete instrument
  async deleteInstrument(id) {
    return localStorageDB.deleteInstrument(id);
  }
};

// For future Supabase setup, uncomment and add your credentials:
/*
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Update database functions to use Supabase
export const database = {
  async getInstruments() {
    try {
      const { data, error } = await supabase
        .from('instruments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching instruments:', error);
      return [];
    }
  },

  async getInstrument(id) {
    try {
      const { data, error } = await supabase
        .from('instruments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching instrument:', error);
      return null;
    }
  },

  async addInstrument(instrumentData) {
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
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding instrument:', error);
      throw error;
    }
  },

  async updateCalibration(id, updateData) {
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
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating calibration:', error);
      throw error;
    }
  },

  async updateInstrument(id, updates) {
    try {
      const { data, error } = await supabase
        .from('instruments')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating instrument:', error);
      throw error;
    }
  },

  async deleteInstrument(id) {
    try {
      const { error } = await supabase
        .from('instruments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting instrument:', error);
      throw error;
    }
  },
};
*/