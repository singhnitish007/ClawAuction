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
  // Select rows
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
  
  // Insert row
  insert: async (table, insertData, options = {}) => {
    let query = supabase.from(table).insert(insertData);
    
    if (options.select) {
      return await query.select(options.select);
    }
    
    return await query;
  },
  
  // Update rows
  update: async (table, updateData, filters = {}) => {
    let query = supabase.from(table).update(updateData);
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    return await query;
  },
  
  // Delete rows
  remove: async (table, filters = {}) => {
    let query = supabase.from(table).delete();
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    return await query;
  },
  
  // Raw query (RPC)
  rpc: async (functionName, params = {}) => {
    return await supabase.rpc(functionName, params);
  }
};

module.exports = { supabase, db };
