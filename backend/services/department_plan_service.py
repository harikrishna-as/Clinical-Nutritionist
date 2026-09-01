"""
Department Plan Service - recommends IV fluids, additives and nutrition targets
for a patient in a specific department, based on the department's clinical
profile plus the patient's vitals and lab values.
"""
import math


class DepartmentPlanService:
    FLUIDS = {
        "ns": {
            "name": "0.9% Normal Saline (NS)",
            "type": "Crystalloid",
            "cal": "0 kcal/L",
            "na": "154 mEq/L",
            "k": "0",
            "cautions": "Hypernatremia, fluid overload, hyperchloremic acidosis",
        },
        "dns": {
            "name": "Dextrose-Normal Saline (DNS) 5% in 0.9%",
            "type": "Crystalloid (hypertonic)",
            "cal": "170 kcal/L",
            "na": "154 mEq/L",
            "k": "0",
            "cautions": "Hyperglycemia, fluid overload, sodium load in cardiac/renal patients",
        },
        "d5w": {
            "name": "5% Dextrose in Water (D5W)",
            "type": "Crystalloid (hypotonic)",
            "cal": "170 kcal/L",
            "na": "0",
            "k": "0",
            "cautions": "Dilutional hyponatremia, hyperglycemia, no electrolytes",
        },
        "d5halfns": {
            "name": "Dextrose 5% in 0.45% Saline (D5 1/2 NS)",
            "type": "Crystalloid (hypertonic)",
            "cal": "170 kcal/L",
            "na": "77 mEq/L",
            "k": "0",
            "cautions": "Hyponatremia risk in pediatric/elderly",
        },
        "rl": {
            "name": "Ringer's Lactate (RL / Hartmann's)",
            "type": "Balanced crystalloid",
            "cal": "9 kcal/L (lactate)",
            "na": "130 mEq/L",
            "k": "4 mEq/L",
            "cautions": "Lactate clearance in liver failure; contains K — check hyperkalemia",
        },
        "hypertonic3": {
            "name": "3% Hypertonic Saline",
            "type": "Hypertonic crystalloid",
            "cal": "0",
            "na": "513 mEq/L",
            "k": "0",
            "cautions": "Osmotic demyelination — slow rate, central line, ICU only",
        },
        "plasmelyte": {
            "name": "Plasma-Lyte 148",
            "type": "Balanced crystalloid",
            "cal": "0",
            "na": "140 mEq/L",
            "k": "5 mEq/L",
            "cautions": "Contains K and Mg — check renal function",
        },
        "d10w": {
            "name": "10% Dextrose in Water (D10W)",
            "type": "Crystalloid (hypertonic)",
            "cal": "340 kcal/L",
            "na": "0",
            "k": "0",
            "cautions": "Hyperglycemia; pediatric/neonatal IV maintenance",
        },
    }

    # base fluid choice + nutrition profile per department
    DEPT_PROFILE = {
        "icu": {"fluid": "ns", "rescue": "rl", "protein": "1.2-1.5 g/kg", "cal": 25, "af": 1.2, "route": "Enteral preferred (early EN within 24-48h); PN if EN fails >7 days", "note": "Resuscitation-grade monitoring; refeeding risk protocol"},
        "eicu": {"fluid": "ns", "rescue": "rl", "protein": "1.2-1.5 g/kg", "cal": 25, "af": 1.2, "route": "Enteral preferred; tele-ICU protocolized feeding", "note": "Automated calorie tracking; refeeding risk flags"},
        "sicu": {"fluid": "rl", "rescue": "ns", "protein": "1.5-2.0 g/kg", "cal": 27, "af": 1.3, "route": "Early oral/EN post-op; immunonutrition pre/post major surgery", "note": "Watch ileus, anastomotic leak, fistulas"},
        "micu": {"fluid": "ns", "rescue": "rl", "protein": "1.2-1.5 g/kg", "cal": 25, "af": 1.25, "route": "Organ-specific formulas (liver, renal, pancreas)", "note": "Adjust for DKA, hepatic failure, AKI"},
        "ticu": {"fluid": "rl", "rescue": "ns", "protein": "1.5-2.5 g/kg", "cal": 28, "af": 1.35, "route": "High-protein high-energy EN; burns need 25-35 kcal/kg", "note": "Hypermetabolic; monitor hyperglycemia, GI intolerance"},
        "cicu": {"fluid": "ns", "rescue": "rl", "protein": "1.2-1.5 g/kg", "cal": 22, "af": 1.2, "route": "Sodium/fluid restriction with adequate protein", "note": "Fluid overload risk; daily weights; low-Na menu"},
        "ot": {"fluid": "rl", "rescue": "ns", "protein": "1.2-1.5 g/kg", "cal": 25, "af": 1.3, "route": "ERAS: clear carbs 2h pre-op; early oral resumption", "note": "Pre-op SGA screen; flag malnutrition 10-14 days pre-op"},
        "pediatric": {"fluid": "d5halfns", "rescue": "ns", "protein": "1.0-1.5 g/kg", "cal": 0, "af": 1.3, "route": "Breastfeeding/complementary feeding; growth monitoring", "note": "Holliday-Segar fluid calculation; avoid excess Na"},
        "pregnancy": {"fluid": "ns", "rescue": "rl", "protein": "+25 g/day", "cal": 25, "af": 1.4, "route": "GWG tracking; lactation: +300-500 kcal, high fluids", "note": "Lactation support for milk secretion; iron/folate/calcium"},
        "nicu": {"fluid": "d10w", "rescue": "ns", "protein": "2.5-3.5 g/kg", "cal": 0, "af": 1.1, "route": "Human milk + fortifier; PN amino acids day 1 in <1500g", "note": "Trophic feeds 12-24 ml/kg/day; NEC risk"},
        "nephrology": {"fluid": "ns", "rescue": "rl", "protein": "1.2 g/kg (dialysis)", "cal": 25, "af": 1.25, "route": "Renal formulas; phosphate binders with meals", "note": "Restrict K/PO4; dialysis fluid restriction 500ml + urine"},
        "oncology": {"fluid": "ns", "rescue": "rl", "protein": "1.2-2.0 g/kg", "cal": 25, "af": 1.3, "route": "High-protein energy-dense; EN/PN if oral <60% >7 days", "note": "Mucositis/taste-change diets; PG-SGA screen"},
        "diabetes": {"fluid": "dns", "rescue": "ns", "protein": "1.0-1.5 g/kg", "cal": 23, "af": 1.3, "route": "Carb counting with insulin; low-GI high-fiber pattern", "note": "Monitor glucose with dextrose fluids"},
        "geriatric": {"fluid": "d5halfns", "rescue": "ns", "protein": "1.2-1.5 g/kg", "cal": 25, "af": 1.25, "route": "IDDSI dysphagia diets; high-protein supplements", "note": "Hyponatremia risk; sarcopenia & pressure-ulcer nutrition"},
    }

    def generate(self, form):
        dept = str(form.get("dept_slug", "icu")).lower()
        prof = self.DEPT_PROFILE.get(dept, self.DEPT_PROFILE["icu"])

        vitals = self._vitals(form)
        labs = self._labs(form)
        targets = self._targets(form, prof)

        fluids = self._fluid_plan(dept, prof, vitals, labs)
        additives = self._additive_plan(labs, vitals, dept)
        warnings = self._warnings(labs, vitals, dept)
        monitoring = self._monitoring(labs, dept)

        return {
            "department": dept,
            "department_name": form.get("dept_name", dept.upper()),
            "patient": self._patient_summary(form, vitals, labs, targets),
            "targets": targets,
            "fluids": fluids,
            "additives": additives,
            "warnings": warnings,
            "monitoring": monitoring,
            "engine": "dept-rules",
        }

    def _vitals(self, form):
        return {
            "hr": self._num(form.get("heart_rate")),
            "bp_sys": self._num(form.get("bp_systolic")),
            "bp_dia": self._num(form.get("bp_diastolic")),
            "urine": self._num(form.get("urine_output")),
            "hydration": str(form.get("hydration", "well")).lower(),
            "fever": self._num(form.get("temperature")),
        }

    def _labs(self, form):
        return {
            "sodium": self._num(form.get("sodium")),
            "potassium": self._num(form.get("potassium")),
            "creatinine": self._num(form.get("creatinine")),
            "glucose": self._num(form.get("glucose")),
            "hemoglobin": self._num(form.get("hemoglobin")),
            "albumin": self._num(form.get("albumin")),
            "phosphate": self._num(form.get("phosphate")),
            "magnesium": self._num(form.get("magnesium")),
            "npo_days": self._num(form.get("npo_days")),
        }

    @staticmethod
    def _num(v):
        try:
            f = float(v)
            return f if math.isfinite(f) else None
        except (TypeError, ValueError):
            return None

    def _targets(self, form, prof):
        gender = str(form.get("Gender", "M")).upper()
        age = self._num(form.get("Age")) or 40
        weight = self._num(form.get("Weight")) or 65
        height = self._num(form.get("Height")) or 165
        if gender == "M":
            bmr = 10 * weight + 6.25 * height - 5 * age + 5
        else:
            bmr = 10 * weight + 6.25 * height - 5 * age - 161
        calories = int(round(max(bmr, 1200) * prof["af"]))
        fluid_ml = self._fluid_target(dept=prof.get("name", ""), weight=weight, age=age)
        return {
            "calories_kcal": calories,
            "protein": prof["protein"],
            "fluid_ml_per_day": fluid_ml,
            "route": prof["route"],
            "note": prof["note"],
        }

    def _fluid_target(self, dept, weight, age):
        if age <= 18:
            return "Holliday-Segar 100/50/20 ml/kg/day"
        return f"{int(weight * 30)} ml/day (~30 ml/kg) — adjust to losses & urine output"

    def _fluid_plan(self, dept, prof, vitals, labs):
        plan = []
        primary = self.FLUIDS[prof["fluid"]]
        rescue = self.FLUIDS[prof["rescue"]]

        # adjust primary by labs
        chosen = primary
        reason = f"Standard maintenance/resuscitation fluid for {prof.get('name', dept)} patients"
        if labs["sodium"] is not None:
            if labs["sodium"] > 148:
                chosen = self.FLUIDS["d5halfns"]
                reason = "Hypernatremia — use hypotonic solution for free-water replacement"
            elif labs["sodium"] < 130:
                chosen = self.FLUIDS["ns"]
                reason = "Hyponatremia — isotonic correction; 3% hypertonic only if severe with neuro symptoms (ICU, central line)"
        if labs["potassium"] is not None and labs["potassium"] > 5.5 and chosen == self.FLUIDS["rl"]:
            chosen = self.FLUIDS["ns"]
            reason = "Hyperkalemia — avoid K-containing RL; use NS"
        if labs["glucose"] is not None and labs["glucose"] > 200 and "Dextrose" in chosen["name"]:
            chosen = self.FLUIDS["ns"]
            reason = "Hyperglycemia — avoid dextrose maintenance; NS until glucose controlled"
        if labs["glucose"] is not None and labs["glucose"] < 70 and "Dextrose" not in chosen["name"]:
            chosen = self.FLUIDS["dns"]
            reason = "Hypoglycemia — dextrose-containing fluid; give thiamine first if alcohol/malnutrition risk"
        if dept in ("nephrology", "cicu") and chosen == self.FLUIDS["rl"]:
            chosen = self.FLUIDS["ns"]
            reason = f"{dept.upper()}: avoid K-containing balanced fluids; NS with tight fluid control"

        plan.append({**chosen, "role": "Primary", "rate": self._rate(dept, prof, vitals, labs), "reason": reason})

        if rescue["name"] != chosen["name"]:
            plan.append({
                **rescue, "role": "Rescue / bolus",
                "rate": "Bolus 10-20 ml/kg over 15-30 min per resuscitation protocol (reassess)",
                "reason": "Resuscitation fluid for hypovolemia/shock",
            })

        if vitals["hydration"] in ("mild", "severe"):
            plan.append({
                **self.FLUIDS["rl"], "role": "Rehydration",
                "rate": "Mild: 50 ml/kg over 4h; Severe: 100 ml/kg over 6h then reassess",
                "reason": f"Dehydration ({vitals['hydration']}) — rehydration phase",
            })

        # pediatric special
        if dept in ("pediatric", "nicu"):
            plan = [{
                **self.FLUIDS["d10w" if dept == "nicu" else "d5halfns"],
                "role": "Maintenance",
                "rate": "Holliday-Segar: 100 ml/kg for first 10kg, 50 ml/kg for next 10kg, 20 ml/kg thereafter",
                "reason": f"{'Neonatal' if dept == 'nicu' else 'Pediatric'} maintenance — monitor glucose",
            }, {
                **self.FLUIDS["ns"], "role": "Bolus",
                "rate": "10-20 ml/kg over 20-30 min if hypovolemic (as ordered)",
                "reason": "Resuscitation bolus",
            }]

        return plan

    def _rate(self, dept, prof, vitals, labs):
        if dept in ("pediatric", "nicu"):
            return "Holliday-Segar formula (age-based)"
        if dept == "cicu":
            return "Restricted: 20-25 ml/kg/day or as per CHF protocol"
        if dept == "nephrology":
            return "500 ml + urine output per day (dialysis)"
        return "25-30 ml/kg/day maintenance; bolus for resuscitation"

    def _additive_plan(self, labs, vitals, dept):
        adds = []
        na = labs.get("sodium"); k = labs.get("potassium")
        po4 = labs.get("phosphate"); mg = labs.get("magnesium")
        glu = labs.get("glucose"); hb = labs.get("hemoglobin")
        alb = labs.get("albumin"); npo = labs.get("npo_days")

        if k is not None and k < 3.5:
            adds.append({"name": "Potassium Chloride (KCl) 20-40 mEq IV", "reason": f"Hypokalemia (K={k}) — especially in refeeding/DKA recovery", "combination": "Max 10-20 mEq/h peripheral, 40 mEq/h central; in NS", "caution": "Never IV push; monitor K; hyperkalemia risk in renal failure"})
        if mg is not None and mg < 1.7:
            adds.append({"name": "Magnesium Sulfate 2-4g IV", "reason": f"Hypomagnesemia (Mg={mg}) — with KCl co-replacement", "combination": "With NS/D5W over 2-4h", "caution": "Respiratory depression; hypotension; check reflexes"})
        if po4 is not None and po4 < 2.5:
            adds.append({"name": "Sodium Phosphate (NaPO4) IV", "reason": f"Hypophosphatemia (PO4={po4}) — critical in refeeding", "combination": "Dilute; central line preferred; with K & Mg", "caution": "Hypocalcemia; hypotension; dose cautiously"})
        if npo is not None and npo >= 3:
            adds.append({"name": "IV Multivitamin (MVI)", "reason": f"NPO {npo} days — micronutrient coverage", "combination": "Add to TPN or dilute in 100ml NS", "caution": "Contains K in some formulations"})
            adds.append({"name": "Thiamine (Vit B1) 100mg IV", "reason": "Prolonged NPO/malnutrition — prevent Wernicke/refeeding", "combination": "With 100ml NS/D5W over 30-60 min; BEFORE dextrose", "caution": "Anaphylaxis rare; give before glucose"})
        if na is not None and na < 130:
            adds.append({"name": "3% Hypertonic Saline (severe only)", "reason": f"Severe hyponatremia (Na={na}) with neuro symptoms — ICU central line", "combination": "Slow infusion; frequent Na checks", "caution": "Osmotic demyelination — must be slow"})
        if glu is not None and glu < 70:
            adds.append({"name": "Dextrose bolus (D50W 25-50 ml)", "reason": f"Hypoglycemia (glucose={glu})", "combination": "IV push then D5W/DNS maintenance", "caution": "Check glucose in 15 min; thiamine first if alcohol"})
        if hb is not None and hb < 9:
            adds.append({"name": "Iron Sucrose (Venofer) IV", "reason": f"Anemia (Hb={hb}) unresponsive to oral iron", "combination": "Dilute in 100ml NS over 30-60 min", "caution": "Anaphylaxis; hypotension; avoid in active infection"})
        if alb is not None and alb < 3.0:
            adds.append({"name": "Albumin 20% (adjunct)", "reason": f"Hypoalbuminemia (albumin={alb})", "combination": "Infuse alone; NOT a nutrition therapy", "caution": "Fluid overload; expensive; restrict in CHF"})

        if not adds:
            adds.append({"name": "No IV additives indicated", "reason": "Electrolytes within target ranges on current data", "combination": "—", "caution": "Recheck electrolytes daily on maintenance fluids"})
        return adds

    def _warnings(self, labs, vitals, dept):
        w = []
        if dept in ("icu", "eicu", "micu", "ticu", "sicu"):
            w.append("Refeeding syndrome risk — monitor K, Mg, PO4 and thiamine before full feeds")
        if labs["potassium"] is not None and labs["potassium"] > 5.5:
            w.append("Hyperkalemia — avoid K-containing fluids/supplements; consider calcium gluconate cardiac protection")
        if labs["creatinine"] is not None and labs["creatinine"] > 1.5:
            w.append("Elevated creatinine — renal dosing for fluids/K; avoid nephrotoxic combinations")
        if labs["glucose"] is not None and labs["glucose"] > 200:
            w.append("Hyperglycemia — insulin per protocol with dextrose fluids")
        if labs["sodium"] is not None and labs["sodium"] < 130:
            w.append("Severe hyponatremia — slow correction only; central line for hypertonic saline")
        if vitals["urine"] is not None and vitals["urine"] < 0.5:
            w.append("Oliguria — reassess volume status before more fluids (AKI risk)")
        if dept == "cicu":
            w.append("Fluid overload in CHF — restrict to cardiac protocol, daily weights")
        if dept == "nephrology":
            w.append("Phosphate binders must be timed with meals; avoid K/PO4-rich foods")
        if dept == "nicu":
            w.append("NEC risk — advance feeds cautiously in preterm infants")
        return w

    def _monitoring(self, labs, dept):
        m = ["Daily weight & fluid balance", "Urine output hourly (ICU/step-down)", "Daily electrolytes while on IV additives", "Blood glucose 4-6 hourly on dextrose/insulin"]
        if dept in ("pediatric", "nicu"):
            m.append("Growth chart (weight/height/head circumference) tracking")
        if dept == "pregnancy":
            m.append("GWG vs pre-pregnancy BMI targets; Hb at 28 weeks")
        if dept == "diabetes":
            m.append("Carb counting accuracy vs insulin adjustments")
        return m

    def _patient_summary(self, form, vitals, labs, targets):
        return {
            "name": form.get("Name") or "Patient",
            "age": form.get("Age"),
            "gender": form.get("Gender"),
            "weight_kg": form.get("Weight"),
            "height_cm": form.get("Height"),
            "diagnosis": form.get("Diagnosis") or "—",
            "severity": form.get("Severity") or "Medium",
            "allergies": form.get("Allergies") or "None",
            "medications": form.get("Medications") or "None",
            "vitals": vitals,
            "labs": labs,
        }
