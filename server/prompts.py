

BLOOD_GLUCOSE_CONTEXT = """
# Blood Glucose Basics

...TODO: prompt for desired output format...

## Core Concepts

Insulin is a hormone produced by the pancreas that helps regulate blood glucose levels. In Type 1 diabetes, the body's immune system mistakenly attacks and destroys insulin-producing cells in the pancreas, leading to a lack of insulin production. This results in high blood glucose levels, which can cause various health complications if not managed properly. In type 2 diabetes, the body either resists the effects of insulin or doesn't produce enough insulin to maintain normal glucose levels.

Eating carbohydrates raises blood glucose levels, while insulin helps lower them by facilitating the uptake of glucose into cells for energy. People with Type 1 diabetes often need to take insulin injections or use an insulin pump to manage their blood glucose levels, and people with type 2 only sometimes need insulin.

## Key Aspects of Diabetes Management

### Blood Glucose Monitoring
- Regularly check blood glucose levels using a glucose meter or continuous glucose monitor (CGM).
- Target range is typically 70-180 mg/dL (3.9-10 mmol/L), but may vary based on individual factors.
- Understand the concepts of hyperglycemia (high blood sugar) and hypoglycemia (low blood sugar).

### Insulin Administration
- Types of insulin: rapid-acting, short-acting, intermediate-acting, and long-acting.
- Methods of delivery: injections (syringes, pens) or insulin pumps.

### Carbohydrate Counting
- Count carbohydrates in meals and snacks to determine insulin dosage.
- Understand the concept of insulin-to-carb ratios.

### Factors Affecting Blood Glucose Levels
1. Food intake (especially carbohydrates)
2. Physical activity (can make you more sensitive to insulin)
3. Stress and emotions
4. Illness and infections
5. Hormonal changes (e.g., menstrual cycle)
6. Medications
7. Alcohol consumption
8. Sleep patterns
"""


NUTRITION_FACTS_PLEASE_PROMPT = """
You are an expert in food and nutrition. A user has asked you to provide some nutrition facts about a specific food item by inspection only. Please
make your best guess based on the provided image, and output the following nutrition facts object:
data": {
  "calories": int,
  "fat": int,
  "saturatedFat": int,
  "carbohydrate": int,
  "sugar": int,
  "dietaryFiber": int,
  "protein": int,
  "cholesterol": int,
  "sodium": int,
}

where each value is in grams or milligrams, and the total sum of calories from fat, carbohydrates, and protein should add up to the total calorie count.

ONLY OUTPUT THIS JSON OBJECT. DO NOT INCLUDE ANY OTHER INFORMATION OR TEXT IN YOUR RESPONSE.
"""