"""
Health Assessment Service - generates structured, explainable assessment
reports for conditions like weight gain/loss, hair fall, protein deficiency
and malnutrition, using rule-based clinical logic over the patient form data
(optionally combined with the image classifier output).
"""
import math


class AssessmentService:
    CONDITIONS = {
        "weight_gain": "Weight Gain",
        "weight_loss": "Weight Loss",
        "hairfall": "Hair Fall",
        "protein_deficiency": "Protein Deficiency",
        "malnutrition": "Malnutrition",
        "anemia": "Anemia (Iron / B12 / Folate)",
    }

    def __init__(self):
        self._rules = self._build_rules()

    def _build_rules(self):
        base = {
            "weight_gain": {
                "label": "Weight Gain",
                "plan": [
                    "Add +300-500 kcal/day over calculated needs for gradual gain",
                    "Protein 1.2-1.5 g/kg body weight, spread over 5-6 small meals",
                    "Energy-dense foods: nut butters, full-fat dairy, oils, dried fruits",
                    "Liquid calories between meals (milkshakes, smoothies, soups with oil)",
                    "Add strength training with protein timing to build lean mass",
                    "Re-assess weight weekly; adjust surplus if gain stalls or exceeds 0.5 kg/wk",
                ],
                "recommended_foods": ["Nut & seed butters", "Full-fat dairy", "Oats with milk & honey", "Bananas", "Dates", "Avocado", "Grilled chicken", "Eggs", "Legume sprouts", "Ghee/oil-fortified foods"],
                "foods_to_avoid": ["Excess refined sugar", "Large dilute soups before meals", "Excessive caffeine", "Empty-calorie junk foods"],
                "labs": ["Albumin", "Prealbumin", "Vitamin D", "B12 / Folate", "TSH"],
            },
            "weight_loss": {
                "label": "Weight Loss",
                "plan": [
                    "Moderate calorie deficit of 500-750 kcal/day (0.5-1 kg/week)",
                    "Protein 1.6-2.2 g/kg to preserve lean mass during deficit",
                    "High-fiber vegetables and low-glycemic carbs for satiety",
                    "Aim for initial 5-7% weight loss for metabolic improvement",
                    "Portion control, mindful eating, regular physical activity",
                    "Track waist circumference and body composition, not just scale weight",
                ],
                "recommended_foods": ["Lean proteins", "Leafy greens", "Whole grains", "Legumes & beans", "Nuts (portion controlled)", "Water & unsweetened tea", "Berries"],
                "foods_to_avoid": ["Sugary beverages & juices", "Refined white bread", "Fried foods", "Ultra-processed snacks", "Excess alcohol"],
                "labs": ["HbA1c", "Lipid profile", "ALT/AST", "TSH", "Vitamin D"],
            },
            "hairfall": {
                "label": "Hair Fall",
                "plan": [
                    "Target serum ferritin > 40-70 ng/mL; treat iron deficiency first",
                    "Protein 1.2 g/kg/day with complete proteins at each meal",
                    "Correct zinc, vitamin D, B12 and folate if deficient",
                    "Avoid crash diets and rapid weight loss (telogen effluvium trigger)",
                    "Gentle hair care; reduce chemical treatments and heat styling",
                    "Allow 3-6 months for visible regrowth after correction",
                ],
                "recommended_foods": ["Eggs (biotin & protein)", "Spinach & lentils (iron)", "Fish & seafood (zinc)", "Nuts & seeds", "Greek yogurt", "Sweet potato (beta-carotene)"],
                "foods_to_avoid": ["Crash diets", "Excess vitamin A", "Raw egg whites (avidin)", "Excessive caffeine", "Alcohol"],
                "labs": ["Serum ferritin", "CBC", "Vitamin D", "B12 / Folate", "TSH", "Zinc"],
            },
            "protein_deficiency": {
                "label": "Protein Deficiency",
                "plan": [
                    "Protein 1.2-2.0 g/kg/day depending on stress state & renal status",
                    "Distribute 20-30 g high-biological-value protein per meal",
                    "Combine complementary plant proteins (rice + beans, wheat + legumes)",
                    "Consider whey/pea protein supplements if oral intake inadequate",
                    "Correct B12, iron and zinc needed for protein synthesis",
                    "Treat underlying cause: infection, malabsorption, hypercatabolism",
                ],
                "recommended_foods": ["Chicken & fish", "Eggs", "Greek yogurt & paneer", "Lentils & chickpeas", "Soy / tofu", "Nuts & seeds", "Whey or pea protein"],
                "foods_to_avoid": ["Prolonged low-protein diets", "Carb-only meals", "Excess alcohol", "Highly processed protein substitutes"],
                "labs": ["Albumin", "Prealbumin", "Total protein", "Transferrin", "BUN", "CBC"],
            },
            "malnutrition": {
                "label": "Malnutrition",
                "plan": [
                    "Treat life-threatening issues first; feed cautiously to avoid refeeding",
                    "Start at 10-20 kcal/kg and advance slowly over several days",
                    "Thiamine 100mg + monitor K, Mg, PO4 before and during refeeding",
                    "High-protein, energy-dense nutrition support (oral, EN or PN)",
                    "Daily monitoring: weight, edema, intake, electrolytes",
                    "Treat infection and underlying disease simultaneously",
                ],
                "recommended_foods": ["Energy-dense fortified foods", "Milk-based supplements", "Nut-based RUTF pastes", "Protein-rich meals", "Vitamin-mineral multimix"],
                "foods_to_avoid": ["Overfeeding early", "Rapid refeeding", "Single-nutrient correction", "Dilute low-calorie foods"],
                "labs": ["Albumin", "Prealbumin", "Electrolytes (K, Mg, PO4)", "CBC", "Vitamin D", "Glucose"],
            },
            "anemia": {
                "label": "Anemia (Iron / B12 / Folate)",
                "plan": [
                    "Iron 60-120 mg elemental/day with vitamin C to enhance absorption",
                    "B12 supplementation for deficiency (oral 1000 mcg or parenteral)",
                    "Folate 400-1000 mcg/day given WITH B12 to avoid masking deficiency",
                    "Separate iron from tea, coffee and calcium by at least 1 hour",
                    "Treat underlying cause: blood loss, malabsorption, dietary inadequacy",
                    "Repeat CBC after 4 weeks to document response",
                ],
                "recommended_foods": ["Red meat & liver", "Spinach", "Lentils & beans", "Fortified cereals", "Citrus fruits (vitamin C)", "Eggs", "Shellfish"],
                "foods_to_avoid": ["Tea/coffee with iron meals", "Calcium with iron", "Excess milk in children", "Phytate-heavy meals alone"],
                "labs": ["CBC + MCV", "Ferritin", "B12", "Folate", "TIBC / TSAT", "Reticulocyte count"],
            },
        }
        return base

    def _severity(self, form):
        sev = str(form.get("Severity", "Mild")).lower()
        if sev in ("severe", "high"):
            return "High", "#ef4444"
        if sev in ("moderate", "medium"):
            return "Moderate", "#f5b041"
        return "Low", "#22c55e"

    def _causes(self, cond, form):
        causes = {
            "weight_gain": [
                "Chronic calorie surplus relative to needs",
                "Low activity level / sedentary lifestyle",
                "Potential endocrine or metabolic factors (check TSH)",
                "Emotional or stress-related eating patterns",
            ],
            "weight_loss": [
                "Sustained calorie deficit below energy needs",
                "Low protein intake risking lean-mass loss",
                "High intake of liquid calories or refined carbs",
                "Limited physical activity",
            ],
            "hairfall": [
                "Iron deficiency (ferritin < 40 ng/mL is strongly associated)",
                "Inadequate dietary protein intake",
                "Micronutrient gaps: zinc, vitamin D, B12, folate",
                "Telogen effluvium after weight loss, stress, surgery or childbirth",
                "Possible thyroid disorder — screen TSH",
            ],
            "protein_deficiency": [
                "Dietary protein below 0.8 g/kg/day",
                "Malabsorption or chronic disease hypercatabolism",
                "Restrictive or plant-only diet without protein combining",
                "Elevated losses: wounds, edema, muscle wasting",
            ],
            "malnutrition": [
                "Reduced oral intake (anorexia, dysphagia, GI losses)",
                "Underlying acute or chronic illness",
                "Prolonged inadequate protein-energy intake",
                "Psychosocial factors: isolation, poverty, mental health",
            ],
            "anemia": [
                "Iron deficiency from blood loss or low intake",
                "B12 deficiency (common in vegans, gastrectomy, PPIs)",
                "Folate deficiency with alcohol use",
                "Malabsorption syndromes (celiac, bariatric surgery)",
            ],
        }
        return causes.get(cond, ["Multiple contributing factors — confirm with labs"])

    def _summary(self, cond, form):
        bmi = self._safe_bmi(form)
        name = self.CONDITIONS.get(cond, "Condition")
        sev = form.get("Severity", "Mild")
        return (
            f"Patient {form.get('Name') or 'presented'} with {name.lower()} concern "
            f"(reported {sev.lower()} severity, duration '{form.get('Duration') or 'not specified'}'). "
            f"Calculated BMI is {bmi:.1f}. The assessment flags the dietary and clinical factors "
            f"below and proposes an evidence-based nutrition care plan with laboratory follow-up. "
            f"Confirm findings with the recommended labs before finalizing the clinical diagnosis."
        )

    @staticmethod
    def _safe_bmi(form):
        try:
            w = float(form.get("Weight", 0))
            h = float(form.get("Height", 0))
            if w <= 0 or h <= 0:
                return 0.0
            return w / ((h / 100) ** 2)
        except (TypeError, ValueError):
            return 0.0

    def generate(self, form):
        cond = str(form.get("condition", "weight_gain")).lower()
        rule = self._rules.get(cond, self._rules["weight_gain"])
        risk, risk_color = self._severity(form)
        return {
            "condition": cond,
            "condition_label": rule["label"],
            "patient": form.get("Name", "Patient"),
            "bmi": round(self._safe_bmi(form), 1),
            "risk_level": risk,
            "risk_color": risk_color,
            "summary": self._summary(cond, form),
            "likely_causes": self._causes(cond, form),
            "plan": rule["plan"],
            "recommended_foods": rule["recommended_foods"],
            "foods_to_avoid": rule["foods_to_avoid"],
            "labs": rule["labs"],
            "engine": "rules",
        }
