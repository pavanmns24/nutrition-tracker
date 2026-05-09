const translations = {
  en: {
    hero_title: "Track Your Nutrition.<br/>Achieve Your Goal.",
    hero_sub: "Log food, calculate BMI, get personalized diet plans — all in one place.",
    get_started: "Get Started",
    login: "Login",
    register: "Register",
    dashboard: "Dashboard",
    food_log: "Food Log",
    bmi_calculator: "BMI Calculator",
    logout: "Logout",
    search_food: "Search Food",
    log_food: "Log Food",
    your_goal: "Your Goal",
    calories: "Calories",
    protein: "Protein",
    carbs: "Carbs",
    fats: "Fats",
    fiber: "Fiber",
    bulk: "Bulk",
    cut: "Cut",
    maintain: "Maintain",
    recommendations: "Food Recommendations",
    daily_progress: "Daily Progress",
    remaining: "Remaining",
  },
  te: {
    hero_title: "మీ పోషణను ట్రాక్ చేయండి.<br/>మీ లక్ష్యాన్ని సాధించండి.",
    hero_sub: "ఆహారం లాగ్ చేయండి, BMI లెక్కించండి, వ్యక్తిగత డైట్ ప్లాన్ పొందండి.",
    get_started: "ప్రారంభించండి",
    login: "లాగిన్",
    register: "నమోదు చేయండి",
    dashboard: "డాష్‌బోర్డ్",
    food_log: "ఆహార లాగ్",
    bmi_calculator: "BMI కాల్క్యులేటర్",
    logout: "లాగ్అవుట్",
    search_food: "ఆహారం వెతకండి",
    log_food: "ఆహారం లాగ్ చేయండి",
    your_goal: "మీ లక్ష్యం",
    calories: "కేలరీలు",
    protein: "ప్రోటీన్",
    carbs: "కార్బ్స్",
    fats: "కొవ్వులు",
    fiber: "ఫైబర్",
    bulk: "బల్క్",
    cut: "కట్",
    maintain: "నిర్వహించండి",
    recommendations: "ఆహార సూచనలు",
    daily_progress: "రోజువారీ పురోగతి",
    remaining: "మిగిలినది",
  }
};

let currentLang = 'en';

function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) {
      el.innerHTML = translations[lang][key];
    }
  });
}