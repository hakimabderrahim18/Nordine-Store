const YALIDINE_API_ID = '55291034042589806124';
const YALIDINE_API_TOKEN = 'cgFoafx9JGTR75eAL0jzqiwrMu8WvU4lkmbBNYQhPK16XISZVHCnODy2psE3dt';

// Simple in-memory cache
const cache = {
  wilayas: null,
  communes: {},
  fees: {}
};

// @desc    Get all wilayas from Yalidine
// @route   GET /api/yalidine/wilayas
// @access  Public
export const getWilayas = async (req, res, next) => {
  try {
    if (cache.wilayas) {
      return res.json({ success: true, data: cache.wilayas });
    }

    const response = await fetch('https://api.yalidine.app/v1/wilayas', {
      headers: {
        'X-API-ID': YALIDINE_API_ID,
        'X-API-TOKEN': YALIDINE_API_TOKEN
      }
    });

    if (!response.ok) {
      throw new Error(`Yalidine API error: ${response.status}`);
    }

    const result = await response.json();
    if (result.data) {
      // Sort wilayas by name
      result.data.sort((a, b) => a.name.localeCompare(b.name));
      cache.wilayas = result.data;
    }

    res.json({ success: true, data: result.data || [] });
  } catch (error) {
    next(error);
  }
};

// @desc    Get communes for a wilaya
// @route   GET /api/yalidine/communes
// @access  Public
export const getCommunes = async (req, res, next) => {
  try {
    const { wilaya_id } = req.query;
    if (!wilaya_id) {
      res.status(400);
      throw new Error('wilaya_id query parameter is required');
    }

    if (cache.communes[wilaya_id]) {
      return res.json({ success: true, data: cache.communes[wilaya_id] });
    }

    const response = await fetch(`https://api.yalidine.app/v1/communes?wilaya_id=${wilaya_id}`, {
      headers: {
        'X-API-ID': YALIDINE_API_ID,
        'X-API-TOKEN': YALIDINE_API_TOKEN
      }
    });

    if (!response.ok) {
      throw new Error(`Yalidine API error: ${response.status}`);
    }

    const result = await response.json();
    if (result.data) {
      // Sort communes by name
      result.data.sort((a, b) => a.name.localeCompare(b.name));
      cache.communes[wilaya_id] = result.data;
    }

    res.json({ success: true, data: result.data || [] });
  } catch (error) {
    next(error);
  }
};

// @desc    Get fees between two wilayas (from Algiers 16 by default)
// @route   GET /api/yalidine/fees
// @access  Public
export const getFees = async (req, res, next) => {
  try {
    const from_wilaya_id = req.query.from_wilaya_id || '16'; // Algiers by default
    const to_wilaya_id = req.query.to_wilaya_id;

    if (!to_wilaya_id) {
      res.status(400);
      throw new Error('to_wilaya_id query parameter is required');
    }

    const cacheKey = `${from_wilaya_id}_${to_wilaya_id}`;
    if (cache.fees[cacheKey]) {
      return res.json({ success: true, data: cache.fees[cacheKey] });
    }

    const response = await fetch(`https://api.yalidine.app/v1/fees?from_wilaya_id=${from_wilaya_id}&to_wilaya_id=${to_wilaya_id}`, {
      headers: {
        'X-API-ID': YALIDINE_API_ID,
        'X-API-TOKEN': YALIDINE_API_TOKEN
      }
    });

    if (!response.ok) {
      throw new Error(`Yalidine API error: ${response.status}`);
    }

    const result = await response.json();
    cache.fees[cacheKey] = result;

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
