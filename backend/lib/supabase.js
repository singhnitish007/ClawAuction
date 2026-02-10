const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
}

const supabase = createClient(
  supabaseUrl || 'https://your-project.supabase.co',
  supabaseKey || 'your-service-key'
);

// Helper functions for common operations
const db = {
  // Query builder helpers
  select: (table, columns = '*', filters = {}) => {
    let query = supabase.from(table).select(columns);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (typeof value === 'object' && value !== null) {
        if (value.not) query = query.not(key, value.not);
        if (value.gt) query = query.gt(key, value.gt);
        if (value.gte) query = query.gte(key, value.gte);
        if (value.lt) query = query.lt(key, value.lt);
        if (value.lte) query = query.lte(key, value.lte);
        if (value.like) query = query.like(key, value.like);
        if (value.ilike) query = query.ilike(key, value.ilike);
      } else {
        query = query.eq(key, value);
      }
    });
    
    return query;
  },
  
  // Insert
  insert: async (table, data, options = {}) => {
    const query = supabase.from(table).insert(data);
    
    if (options.select) {
      const { data, error } = await query.select(options.select);
      return { data, error };
    }
    
    const { data, error } = await query;
    return { data, error };
  },
  
  // Update
  update: async (table, data, filters = {}) => {
    let query = supabase.from(table).update(data);
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    return { data, error };
  },
  
  // Delete
  remove: async (table, filters = {}) => {
    let query = supabase.from(table).delete();
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    return { data, error };
  },
  
  // Raw query
  rpc: async (functionName, params = {}) => {
    const { data, error } = await supabase.rpc(functionName, params);
    return { data, error };
  }
};

module.exports = { supabase, db };
