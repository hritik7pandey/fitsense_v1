import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const modelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';

const model = genAI.getGenerativeModel({
  model: modelName,
  generationConfig: {
    temperature: 0.7,
    topP: 0.85,
    topK: 40,
    maxOutputTokens: 4096,
  },
});

export interface WorkoutGenerationParams {
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  fitnessLevel?: string;
  goals?: string[];
  equipment?: string[];
  daysPerWeek?: number;
  sessionDuration?: number;
}

export interface DietGenerationParams {
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  bmr?: number;
  activityLevel?: string;
  dietaryRestrictions?: string[];
  goals?: string[];
  mealsPerDay?: number;
  foodPreference?: 'veg' | 'non-veg' | 'both';
}

function extractJSON(text: string): string {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
  cleaned = cleaned.replace(/```/g, '');
  
  // Try to find JSON object
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    let jsonStr = match[0];
    
    // Fix common JSON issues from AI output
    // Remove trailing commas before } or ]
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
    // Fix unquoted property names (basic fix)
    jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    // Remove any control characters
    jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, ' ');
    // Fix escaped single quotes
    jsonStr = jsonStr.replace(/\\'/g, "'");
    
    return jsonStr;
  }
  
  return cleaned.trim();
}

function safeJSONParse(text: string): any {
  const jsonString = extractJSON(text);
  
  try {
    return JSON.parse(jsonString);
  } catch (firstError) {
    // Try additional fixes
    let fixed = jsonString;
    
    // Remove any text before first { and after last }
    const firstBrace = fixed.indexOf('{');
    const lastBrace = fixed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      fixed = fixed.substring(firstBrace, lastBrace + 1);
    }
    
    // Try to fix truncated JSON by adding closing brackets
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    
    // Add missing closing brackets/braces
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      fixed += ']';
    }
    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixed += '}';
    }
    
    try {
      return JSON.parse(fixed);
    } catch (secondError) {
      console.error('JSON Parse Error - Original:', jsonString.substring(0, 500));
      console.error('JSON Parse Error - Fixed attempt:', fixed.substring(0, 500));
      throw firstError;
    }
  }
}

export async function generateWorkoutPlan(params: WorkoutGenerationParams): Promise<any> {
  const {
    age = 25,
    gender = 'male',
    heightCm = 170,
    weightKg = 70,
    fitnessLevel = 'beginner',
    goals = ['general fitness'],
    equipment = ['gym equipment'],
    daysPerWeek = 4,
    sessionDuration = 45,
  } = params;

  const prompt = `Create a ${daysPerWeek}-day gym workout plan. Be concise and practical.

User: ${age}yo ${gender}, ${weightKg}kg, ${fitnessLevel} level, goal: ${goals.join(', ')}

Generate ONLY this JSON structure (no extra text):
{
  "planName": "${fitnessLevel} ${goals[0]} Plan",
  "description": "A ${daysPerWeek}-day ${fitnessLevel} workout program",
  "difficulty": "${fitnessLevel}",
  "schedule": [
    {
      "day": "Day 1",
      "focus": "Chest & Triceps",
      "warmup": "5 min cardio + arm circles",
      "exercises": [
        {"name": "Bench Press", "sets": 4, "reps": "8-10", "rest": "90 sec", "notes": "Keep back flat"},
        {"name": "Incline Dumbbell Press", "sets": 3, "reps": "10-12", "rest": "60 sec"},
        {"name": "Cable Flyes", "sets": 3, "reps": "12-15", "rest": "45 sec"},
        {"name": "Tricep Pushdowns", "sets": 3, "reps": "12-15", "rest": "45 sec"},
        {"name": "Overhead Tricep Extension", "sets": 3, "reps": "10-12", "rest": "45 sec"}
      ],
      "cooldown": "5 min stretching"
    }
  ],
  "tips": ["Rest 48hrs between same muscle groups", "Stay hydrated", "Progressive overload weekly"]
}

Create exactly ${daysPerWeek} days with 5-6 exercises each. Use real gym exercises like squats, deadlifts, bench press, rows, pull-ups, shoulder press, lunges, curls, etc.`;

  try {
    console.log('Generating workout with model:', modelName);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return safeJSONParse(text);
  } catch (error: any) {
    console.error('AI Workout Generation Error:', error?.message || error);
    console.error('Model used:', modelName);
    console.error('API Key present:', !!process.env.GEMINI_API_KEY);
    throw new Error(`Failed to generate workout plan: ${error?.message || 'Unknown error'}`);
  }
}

export async function generateDietPlan(params: DietGenerationParams): Promise<any> {
  const {
    age = 25,
    gender = 'male',
    heightCm = 170,
    weightKg = 70,
    activityLevel = 'moderate',
    dietaryRestrictions = [],
    goals = ['maintain weight'],
    mealsPerDay = 4,
    foodPreference = 'both',
  } = params;

  const bmr = gender === 'female'
    ? 655 + (9.6 * weightKg) + (1.8 * heightCm) - (4.7 * age)
    : 66 + (13.7 * weightKg) + (5 * heightCm) - (6.8 * age);

  const activityMultiplier: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };

  let dailyCalories = Math.round(bmr * (activityMultiplier[activityLevel] ?? 1.55));

  // Adjust for goals
  if (goals.includes('lose weight')) dailyCalories -= 300;
  if (goals.includes('gain muscle')) dailyCalories += 300;

  const restrictions = dietaryRestrictions.length > 0
    ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}`
    : '';

  // Food preference instruction
  let foodInstruction = '';
  let exampleFoods = '';
  if (foodPreference === 'veg') {
    foodInstruction = 'IMPORTANT: This must be a PURE VEGETARIAN diet. NO meat, chicken, fish, eggs, or any non-veg items. Use only vegetarian protein sources like paneer, dal, legumes, soya, tofu, nuts, seeds, dairy products (milk, curd, cheese).';
    exampleFoods = 'Use Indian vegetarian foods: paneer, dal, rajma, chole, idli, dosa, poha, upma, paratha, sabzi, curd, lassi, buttermilk, sprouts, soya chunks, tofu, nuts, fruits.';
  } else if (foodPreference === 'non-veg') {
    foodInstruction = 'Include non-vegetarian protein sources like chicken, fish, eggs, mutton in meals for better protein intake.';
    exampleFoods = 'Use Indian foods: roti, rice, dal, chicken curry, fish curry, egg curry, omelette, kebabs, tandoori chicken, sabzi, curd.';
  } else {
    foodInstruction = 'Include a mix of both vegetarian and non-vegetarian options.';
    exampleFoods = 'Use common Indian foods: roti, rice, dal, paneer, chicken, eggs, sabzi, dahi, fruits, oats, poha, upma, idli, etc.';
  }

  const prompt = `Create a ${mealsPerDay}-meal Indian diet plan. Be practical and specific.

User: ${age}yo ${gender}, ${weightKg}kg, ${activityLevel} activity, goal: ${goals.join(', ')}
Target: ~${dailyCalories} calories/day
${restrictions}
${foodInstruction}

${exampleFoods}

Generate ONLY this JSON (no extra text):
{
  "planName": "Indian ${foodPreference === 'veg' ? 'Vegetarian ' : foodPreference === 'non-veg' ? 'Non-Veg ' : ''}${goals[0]} Diet",
  "description": "A balanced ${mealsPerDay}-meal ${foodPreference === 'veg' ? 'vegetarian ' : ''}Indian diet plan",
  "dailyCalories": ${dailyCalories},
  "macros": {"protein": "120g (25%)", "carbs": "250g (50%)", "fats": "55g (25%)"},
  "meals": [
    {
      "type": "Breakfast",
      "time": "8:00 AM",
      "items": [
        {"food": "${foodPreference === 'veg' ? 'Paneer paratha' : 'Poha with peanuts'}", "portion": "2 pieces", "calories": 300, "protein": "12g", "carbs": "35g", "fats": "12g"},
        {"food": "${foodPreference === 'veg' ? 'Curd' : 'Boiled eggs'}", "portion": "${foodPreference === 'veg' ? '1 cup' : '2 whole'}", "calories": 100, "protein": "8g", "carbs": "4g", "fats": "5g"}
      ],
      "totalCalories": 400,
      "notes": "Add vegetables for fiber"
    },
    {
      "type": "Lunch",
      "time": "1:00 PM",
      "items": [
        {"food": "Brown rice", "portion": "1 cup cooked", "calories": 220, "protein": "5g", "carbs": "45g", "fats": "2g"},
        {"food": "Dal tadka", "portion": "1 cup", "calories": 180, "protein": "12g", "carbs": "25g", "fats": "4g"},
        {"food": "${foodPreference === 'veg' ? 'Paneer bhurji' : 'Chicken curry'}", "portion": "150g", "calories": 250, "protein": "22g", "carbs": "10g", "fats": "15g"},
        {"food": "Mixed sabzi", "portion": "1 cup", "calories": 80, "protein": "3g", "carbs": "12g", "fats": "3g"}
      ],
      "totalCalories": 730
    }
  ],
  "hydration": "3-4 liters water daily",
  "tips": ["Eat protein with every meal", "Avoid fried foods", "Include curd for probiotics"]
}

Create exactly ${mealsPerDay} meals with proper Indian ${foodPreference === 'veg' ? 'VEGETARIAN ONLY' : ''} foods and realistic portions.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return safeJSONParse(text);
  } catch (error: any) {
    console.error('AI Diet Generation Error:', error);
    throw new Error('Failed to generate diet plan. Please try again.');
  }
}
