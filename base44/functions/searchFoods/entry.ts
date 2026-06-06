import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const USDA_API_KEY = Deno.env.get('USDA_API_KEY');
if (!USDA_API_KEY) throw new Error('USDA_API_KEY environment variable is not set.');

function mapUsdaFood(food) {
  const get = (name) => {
    const n = food.foodNutrients?.find(n =>
      n.nutrientName?.toLowerCase().includes(name.toLowerCase()) ||
      n.name?.toLowerCase().includes(name.toLowerCase())
    );
    return n ? Math.round((n.value || n.amount || 0) * 10) / 10 : 0;
  };

  return {
    usda_fdc_id: String(food.fdcId),
    name: food.description || food.lowercaseDescription || 'Unknown',
    brand: food.brandOwner || food.brandName || '',
    serving_size: food.servingSize ? `${food.servingSize}${food.servingSizeUnit || 'g'}` : '100g',
    serving_weight_g: food.servingSize || 100,
    calories: get('Energy') || get('Calories') || get('energy'),
    protein_g: get('Protein'),
    carbs_g: get('Carbohydrate') || get('carbohydrate'),
    fats_g: get('Total lipid') || get('Fat') || get('fat'),
    fiber_g: get('Fiber') || get('fiber'),
    sugar_g: get('Sugars') || get('sugar'),
    sodium_mg: get('Sodium') || get('sodium'),
    micronutrients: {
      vitamin_c_mg: get('Vitamin C'),
      iron_mg: get('Iron'),
      calcium_mg: get('Calcium'),
      potassium_mg: get('Potassium'),
      vitamin_d_iu: get('Vitamin D'),
    },
    category: food.foodCategory || food.foodCategoryLabel || '',
    source: 'usda',
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query, pageSize = 20, dataType } = await req.json();
    if (!query || query.trim().length < 2) {
      return Response.json({ foods: [], total: 0 });
    }

    const params = new URLSearchParams({
      query: query.trim(),
      pageSize: String(pageSize),
      api_key: USDA_API_KEY,
      dataType: dataType || 'Foundation,SR Legacy,Branded',
    });

    const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?${params}`);
    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: `USDA API error: ${res.status}`, foods: [] }, { status: 200 });
    }

    const data = await res.json();
    const foods = (data.foods || []).map(mapUsdaFood);

    return Response.json({ foods, total: data.totalHits || foods.length });
  } catch (error) {
    return Response.json({ error: error.message, foods: [] }, { status: 500 });
  }
});