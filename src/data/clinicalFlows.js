// Clinical Question Flows for Conversational History Taking in English, Hindi, Telugu
// Designed for Indian Government Hospital OPD Triage & Case-Taking

export const supportedHistoryLanguages = [
  { code: 'en', name: 'English', native: 'English', voiceLang: 'en-IN' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', voiceLang: 'hi-IN' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', voiceLang: 'te-IN' }
];

export const primaryComplaints = [
  {
    id: 'chest_pain',
    icon: 'Heart',
    en: 'Chest pain',
    hi: 'छाती में दर्द (Chest pain)',
    te: 'ఛాతీ నొప్పి (Chest pain)',
    descEn: 'Pain, tightness, heaviness, or pressure in chest',
    descHi: 'छाती में भारीपन, खिंचाव या दबाव महसूस होना',
    descTe: 'ఛాతీలో బిగుతు, బరువు లేదా ఒత్తిడి'
  },
  {
    id: 'fever',
    icon: 'Thermometer',
    en: 'Fever',
    hi: 'बुखार (Fever)',
    te: 'జ్వరం (Fever)',
    descEn: 'High body temperature, chills, shivering, body ache',
    descHi: 'तेज बुखार, ठंड लगना, कपकपी या बदन दर्द',
    descTe: 'అధిక శరీర ఉష్ణోగ్రత, చలి, వణుకు, ఒళ్లు నొప్పులు'
  },
  {
    id: 'headache',
    icon: 'Brain',
    en: 'Headache',
    hi: 'सिरदर्द (Headache)',
    te: 'తలనొప్పి (Headache)',
    descEn: 'Throbbing, sharp, or sudden severe pain in head',
    descHi: 'सिर में तेज दर्द, चक्कर आना या भारीपन',
    descTe: 'తీవ్రమైన తలనొప్పి, కళ్లు తిరగడం'
  },
  {
    id: 'abdominal_pain',
    icon: 'Activity',
    en: 'Abdominal pain',
    hi: 'पेट में दर्द (Abdominal pain)',
    te: 'కడుపు నొప్పి (Abdominal pain)',
    descEn: 'Stomach cramps, burning, nausea, vomiting',
    descHi: 'पेट में मरोड़, जलन, उल्टी या दस्त',
    descTe: 'కడుపులో మంట, వికారం, వాంతులు'
  },
  {
    id: 'cough',
    icon: 'Wind',
    en: 'Cough',
    hi: 'खांसी (Cough)',
    te: 'దग्గు (Cough)',
    descEn: 'Persistent dry or wet cough, breathlessness',
    descHi: 'लगातार खांसी, बलगम, सांस फूलना',
    descTe: 'ఎడతెగని దగ్గు, కఫం, ఆయాసం'
  },
  {
    id: 'back_pain',
    icon: 'Activity',
    en: 'Back pain',
    hi: 'कमर / पीठ दर्द (Back pain)',
    te: 'నడుము నొప్పి (Back pain)',
    descEn: 'Lower back stiffness, shooting sciatica, spine strain',
    descHi: 'कमर में तेज दर्द, सायटिका, झुकने में तकलीफ',
    descTe: 'నడుము నొప్పి, సయాటికా, కాలు లాగడం'
  },
  {
    id: 'joint_pain',
    icon: 'Activity',
    en: 'Joint pain & Arthritis',
    hi: 'जोड़ों का दर्द व गठिया (Joint pain)',
    te: 'కీళ్ల నొప్పులు (Joint pain)',
    descEn: 'Knee swelling, morning stiffness, uric acid / gout',
    descHi: 'घुटनों में दर्द, सुबह की जकड़न, यूरिक एसिड',
    descTe: 'మోకాళ్ల నొప్పులు, వాపు, ఉదయం బిగుతు'
  },
  {
    id: 'skin_rash',
    icon: 'AlertTriangle',
    en: 'Skin rash & Allergy',
    hi: 'त्वचा पर दाने / खुजली (Skin rash)',
    te: 'చర్మంపై దద్దుర్లు (Skin rash)',
    descEn: 'Itchy hives, blisters, peeling, allergic reactions',
    descHi: 'लाल चकत्ते, खुजली, छाले, दवा से एलर्जी',
    descTe: 'దురద దద్దుర్లు, బొబ్బలు, అలర్జీలు'
  },
  {
    id: 'urinary_trouble',
    icon: 'Activity',
    en: 'Urinary trouble & Kidney pain',
    hi: 'पेशाब में जलन / पथरी (Urinary trouble)',
    te: 'మూత్రంలో మంట / కిడ్నీ సమస్య (Urinary trouble)',
    descEn: 'Burning urination, blood in urine, kidney stone pain',
    descHi: 'पेशाब में तेज जलन, खून आना, पथरी का दर्द',
    descTe: 'మూత్రంలో మంట, రక్తం, కిడ్నీ రాయి నొప్పి'
  },
  {
    id: 'general_weakness',
    icon: 'Heart',
    en: 'Fatigue & Dizziness',
    hi: 'कमजोरी व चक्कर (Fatigue & Dizziness)',
    te: 'నీరసం & తలతిరగడం (Fatigue)',
    descEn: 'Extreme exhaustion, pale skin, anemia, sugar drop',
    descHi: 'बहुत थकान, पीलापन, कमजोरी, शुगर लो होना',
    descTe: 'విపరీతమైన అలసట, రక్తహీనత, నీరసం'
  },
  {
    id: 'other',
    icon: 'HelpCircle',
    en: 'Other complaint',
    hi: 'अन्य समस्या (Other complaint)',
    te: 'ఇతర సమస్య (Other complaint)',
    descEn: 'Eye, ENT, general consultation or routine refill',
    descHi: 'आंख, कान-नाक-गला या सामान्य डॉक्टर परामर्श',
    descTe: 'కంటి, చెవి లేదా ఇతర సాధారణ వైద్య తనిఖీ'
  }
];

export const clinicalQuestionsData = {
  chest_pain: [
    {
      id: 'cp_onset',
      key: 'Onset & Duration',
      en: 'When did the chest pain start?',
      hi: 'छाती में दर्द कब शुरू हुआ?',
      te: 'ఛాతీ నొప్పి ఎప్పుడు ప్రారంభమైంది?',
      type: 'single',
      options: [
        { id: 'cp_on_1', en: 'Less than 1 hour ago (Sudden)', hi: '1 घंटे से भी कम पहले (अचानक)', te: '1 గంట లోపు (అకస్మాత్తుగా)', redFlagScore: 3 },
        { id: 'cp_on_2', en: 'Earlier today (2 to 6 hours ago)', hi: 'आज सुबह / 2 से 6 घंटे पहले', te: 'ఈ రోజు ఉదయం / 2-6 గంటల క్రితం', redFlagScore: 2 },
        { id: 'cp_on_3', en: '1 to 2 days ago', hi: '1 से 2 दिन पहले', te: '1 నుండి 2 రోజుల క్రితం', redFlagScore: 1 },
        { id: 'cp_on_4', en: 'More than a week ago (Intermittent)', hi: 'एक सप्ताह से अधिक समय से (रुक-रुक कर)', te: 'వారం రోజుల కంటే ఎక్కువ' }
      ]
    },
    {
      id: 'cp_location',
      key: 'Location of Pain',
      en: 'Where exactly is the pain located?',
      hi: 'दर्द छाती में ठीक किस जगह पर है?',
      te: 'నొప్పి ఛాతీలో ఖచ్చితంగా ఎక్కడ ఉంది?',
      type: 'single',
      options: [
        { id: 'cp_loc_1', en: 'Center of chest / Behind breastbone', hi: 'छाती के बीच में / सीने की हड्डी के पीछे', te: 'ఛాతీ మధ్యలో / రొమ్ము ఎముక వెనుక', redFlagScore: 2 },
        { id: 'cp_loc_2', en: 'Left side of chest', hi: 'छाती के बाईं ओर (Left side)', te: 'ఛాతీ ఎడమ వైపు', redFlagScore: 2 },
        { id: 'cp_loc_3', en: 'Right side of chest', hi: 'छाती के दाईं ओर (Right side)', te: 'ఛాతీ కుడి వైపు' },
        { id: 'cp_loc_4', en: 'Spreading across whole chest', hi: 'पूरी छाती में फैला हुआ', te: 'మొత్తం ఛాతీ అంతటా', redFlagScore: 2 }
      ]
    },
    {
      id: 'cp_character',
      key: 'Character of Pain',
      en: 'What does the pain feel like?',
      hi: 'दर्द किस प्रकार का महसूस हो रहा है?',
      te: 'నొప్పి ఎలా అనిపిస్తుంది?',
      type: 'single',
      options: [
        { id: 'cp_char_1', en: 'Heavy squeezing / Crushing pressure (Like a weight)', hi: 'भारी दबाव / सीने पर भारी पत्थर जैसा खिंचाव', te: 'బరువైన ఒత్తిడి / ఛాతీని పిండేస్తున్నట్లు', redFlagScore: 3 },
        { id: 'cp_char_2', en: 'Sharp / Stabbing / Piercing pain', hi: 'तेज चुभने वाला / सुई जैसा दर्द', te: 'పదునైన / గుచ్చుకుంటున్న నొప్పి' },
        { id: 'cp_char_3', en: 'Burning sensation (Like severe acidity)', hi: 'तेज जलन (गंभीर एसिडिटी जैसी)', te: 'తీవ్రమైన మంట (ఎసిడిటీ లాగా)' },
        { id: 'cp_char_4', en: 'Dull continuous ache', hi: 'हल्का लगातार मीठा दर्द', te: 'నిరంతర మందమైన నొప్పి' }
      ]
    },
    {
      id: 'cp_severity',
      key: 'Pain Severity',
      en: 'How severe is the pain right now (on a scale of 1 to 10)?',
      hi: 'इस समय दर्द कितना तेज है (1 से 10 के पैमाने पर)?',
      te: 'ప్రస్తుతం నొప్పి తీవ్రత ఎంత (1 నుండి 10 స్కేలుపై)?',
      type: 'scale',
      options: [
        { id: 'cp_sev_1', en: '1-3 (Mild discomfort)', hi: '1-3 (हल्की तकलीफ)', te: '1-3 (స్వల్ప నొప్పి)' },
        { id: 'cp_sev_2', en: '4-6 (Moderate pain)', hi: '4-6 (मध्यम दर्द)', te: '4-6 (మధ్యస్థ నొప్పి)' },
        { id: 'cp_sev_3', en: '7-8 (Severe pain)', hi: '7-8 (गंभीर दर्द)', te: '7-8 (తీవ్రమైన నొప్పి)', redFlagScore: 2 },
        { id: 'cp_sev_4', en: '9-10 (Unbearable / Worst pain)', hi: '9-10 (असहनीय दर्द)', te: '9-10 (భరించలేని అత్యంత తీవ్రమైన నొప్పి)', redFlagScore: 3 }
      ]
    },
    {
      id: 'cp_radiation',
      key: 'Radiation / Spreading',
      en: 'Does the pain spread (radiate) anywhere else?',
      hi: 'क्या दर्द शरीर के किसी अन्य हिस्से में भी जा रहा है?',
      te: 'నొప్పి శరీరంలోని ఇతర భాగాలకు పాకుతుందా?',
      type: 'multi',
      options: [
        { id: 'cp_rad_1', en: 'Left arm / Shoulder / Left hand', hi: 'बाएं हाथ / कंधे / बांह में', te: 'ఎడమ చేయి / భుజం వైపు', redFlagScore: 3 },
        { id: 'cp_rad_2', en: 'Jaw / Teeth / Neck / Throat', hi: 'जबड़े / दांत / गले में', te: 'దవడ / మెడ / గొంతు వైపు', redFlagScore: 2 },
        { id: 'cp_rad_3', en: 'Back / Between shoulder blades', hi: 'पीठ में / कंधों के बीच', te: 'వెన్నుభాగం వైపు', redFlagScore: 2 },
        { id: 'cp_rad_4', en: 'Upper stomach (Epigastrium)', hi: 'पेट के ऊपरी हिस्से में', te: 'కడుపు పైభాగం' },
        { id: 'cp_rad_5', en: 'No, does not spread anywhere', hi: 'नहीं, कहीं और नहीं फैलता', te: 'ఎక్కడికీ పాకడం లేదు' }
      ]
    },
    {
      id: 'cp_triggers',
      key: 'Aggravating Factors',
      en: 'What makes the chest pain worse?',
      hi: 'किस क्रिया से दर्द और बढ़ जाता है?',
      te: 'దేనివల్ల ఛాతీ నొప్పి ఎక్కువవుతుంది?',
      type: 'single',
      options: [
        { id: 'cp_trig_1', en: 'Walking / Climbing stairs / Physical exertion', hi: 'चलने / सीढ़ी चढ़ने / मेहनत करने से', te: 'నడవడం / మెట్లు ఎక్కడం / శ్రమ చేయడం వల్ల', redFlagScore: 2 },
        { id: 'cp_trig_2', en: 'Taking a deep breath / Coughing', hi: 'लंबी सांस लेने या खांसने से', te: 'లోతైన శ్వాస తీసుకోవడం లేదా దగ్గినప్పుడు' },
        { id: 'cp_trig_3', en: 'Lying flat on bed', hi: 'बिस्तर पर सीधे लेटने से', te: 'పడుకున్నప్పుడు' },
        { id: 'cp_trig_4', en: 'Nothing specific / Constant pain', hi: 'लगातार एक जैसा बना हुआ है', te: 'ప్రత్యేక కారణం లేదు / నిరంతరం' }
      ]
    },
    {
      id: 'cp_relief',
      key: 'Relieving Factors',
      en: 'What gives you relief or makes the pain better?',
      hi: 'किस चीज से दर्द में थोड़ा आराम मिलता है?',
      te: 'దేనివల్ల నొప్పి తగ్గుతుంది లేదా ఉపశమనం కలుగుతుంది?',
      type: 'single',
      options: [
        { id: 'cp_rel_1', en: 'Rest / Stopping activity', hi: 'आराम करने या रुकने से', te: 'విశ్రాంతి తీసుకోవడం వల్ల' },
        { id: 'cp_rel_2', en: 'Sitting upright & leaning forward', hi: 'आगे झुककर बैठने से', te: 'ముందుకు వంగి కూర్చోవడం వల్ల' },
        { id: 'cp_rel_3', en: 'Antacid gel / Hot water / Food', hi: 'एंटासिड दवा या गर्म पानी से', te: 'ఎసిడిటీ సిరప్ / వేడి నీళ్లు తాగినప్పుడు' },
        { id: 'cp_rel_4', en: 'No relief with anything', hi: 'किसी भी चीज से आराम नहीं मिला', te: 'దేనివల్లా ఉపశమనం లేదు', redFlagScore: 2 }
      ]
    },
    {
      id: 'cp_breathlessness',
      key: 'Breathlessness',
      en: 'Are you experiencing shortness of breath or breathing difficulty?',
      hi: 'क्या आपको सांस लेने में तकलीफ या सांस फूलने की समस्या हो रही है?',
      te: 'మీకు శ్వాస తీసుకోవడంలో ఇబ్బంది లేదా ఆయాసం ఉందా?',
      type: 'single',
      options: [
        { id: 'cp_br_1', en: 'Yes, severe breathing difficulty at rest', hi: 'हाँ, बैठे-बैठे भी बहुत सांस फूल रही है', te: 'అవును, విశ్రాంతిగా ఉన్నా తీవ్రమైన ఆయాసం ఉంది', redFlagScore: 3 },
        { id: 'cp_br_2', en: 'Yes, mild difficulty on walking', hi: 'हाँ, थोड़ा चलने पर सांस फूलती है', te: 'అవును, నడిచినప్పుడు కొద్దిగా ఆయాసం వస్తుంది', redFlagScore: 1 },
        { id: 'cp_br_3', en: 'No breathing difficulty', hi: 'नहीं, सांस लेने में कोई तकलीफ नहीं है', te: 'లేదు, శ్వాసలో ఎటువంటి ఇబ్బంది లేదు' }
      ]
    },
    {
      id: 'cp_sweating',
      key: 'Sweating & Nausea',
      en: 'Are you experiencing cold sweating, dizziness, or nausea?',
      hi: 'क्या आपको ठंडा पसीना, चक्कर या उल्टी जैसा महसूस हो रहा है?',
      te: 'మీకు చల్లని చెమటలు, తలతిరగడం లేదా వాంతి వచ్చినట్లు ఉందా?',
      type: 'single',
      options: [
        { id: 'cp_sw_1', en: 'Yes, profuse cold sweats & feeling faint', hi: 'हाँ, बहुत अधिक ठंडा पसीना आ रहा है और चक्कर हैं', te: 'అవును, విపరీతంగా చల్లని చెమటలు & కళ్లు తిరగడం', redFlagScore: 3 },
        { id: 'cp_sw_2', en: 'Mild nausea / uneasiness only', hi: 'केवल हल्का जी मिचलाना या घबराहट', te: 'కేవలం స్వల్ప వికారం లేదా కంగారు' },
        { id: 'cp_sw_3', en: 'No sweating or nausea', hi: 'नहीं, पसीना या उल्टी जैसा कुछ नहीं है', te: 'లేదు, చెమటలు లేదా వికారం లేవు' }
      ]
    },
    {
      id: 'cp_past_heart',
      key: 'Previous Heart Disease',
      en: 'Do you have any past history of heart disease, heart attack, or stent placement?',
      hi: 'क्या आपको पहले कभी दिल की बीमारी, हार्ट अटैक या छल्ला (Stent) पड़ा है?',
      te: 'గతంలో మీకు గుండెజబ్బు, హార్ట్ ఎటాక్ లేదా స్టెంట్ వేసిన చరిత్ర ఉందా?',
      type: 'single',
      options: [
        { id: 'cp_ph_1', en: 'Yes, previous Heart Attack / Angioplasty Stent / Bypass', hi: 'हाँ, पहले हार्ट अटैक / स्टेंट / बाईपास हुआ है', te: 'అవును, గతంలో హార్ట్ ఎటాక్ / స్టెంట్ / బైపాస్ జరిగింది', redFlagScore: 3 },
        { id: 'cp_ph_2', en: 'No previous heart disease history', hi: 'नहीं, पहले कोई दिल की बीमारी नहीं रही', te: 'గతంలో గుండె జబ్బులు ఏవీ లేవు' },
        { id: 'cp_ph_3', en: 'Not sure / Never tested', hi: 'पता नहीं / कभी जांच नहीं कराई', te: 'సరిగ్గా తెలియదు' }
      ]
    },
    {
      id: 'cp_diabetes',
      key: 'Diabetes (Blood Sugar)',
      en: 'Do you have Diabetes (Sugar disease)?',
      hi: 'क्या आपको डायबिटीज (शुगर की बीमारी) है?',
      te: 'మీకు డయాబెటిస్ (షుగర్ వ్యాధి) ఉందా?',
      type: 'single',
      options: [
        { id: 'cp_dm_1', en: 'Yes, on Insulin or daily tablets', hi: 'हाँ, इंसुलिन या रोजाना की दवाइयां लेता हूँ', te: 'అవును, ఇన్సులిన్ లేదా రోజూ మందులు వాడుతున్నాను', redFlagScore: 1 },
        { id: 'cp_dm_2', en: 'No Diabetes', hi: 'नहीं, शुगर नहीं है', te: 'షుగర్ లేదు' },
        { id: 'cp_dm_3', en: 'Borderline / Diet controlled', hi: 'बॉर्डरलाइन / खानपान से नियंत्रित', te: 'స్వల్పంగా ఉంది' }
      ]
    },
    {
      id: 'cp_hypertension',
      key: 'Hypertension (High BP)',
      en: 'Do you have High Blood Pressure (Hypertension)?',
      hi: 'क्या आपको हाई ब्लड प्रेशर (हाई बीपी) की समस्या है?',
      te: 'మీకు హై బ్లడ్ ప్రెషర్ (హై బీపీ) ఉందా?',
      type: 'single',
      options: [
        { id: 'cp_ht_1', en: 'Yes, taking BP medicine daily', hi: 'हाँ, रोजाना बीपी की दवा लेता हूँ', te: 'అవును, రోజూ బీపీ మందులు వాడుతున్నాను', redFlagScore: 1 },
        { id: 'cp_ht_2', en: 'No High BP history', hi: 'नहीं, बीपी सामान्य रहता है', te: 'బీపీ సమస్య లేదు' },
        { id: 'cp_ht_3', en: 'Recently diagnosed / Irregular medicine', hi: 'हाल ही में पता चला / अनियमित दवा', te: 'ఇటీవలే తెలిసింది / క్రమం తప్పకుండా వేసుకుంటాను', redFlagScore: 2 }
      ]
    },
    {
      id: 'cp_meds',
      key: 'Current Medicines',
      en: 'What medicines are you currently taking?',
      hi: 'वर्तमान में आप कौन सी दवाइयां ले रहे हैं?',
      te: 'ప్రస్తుతం మీరు ఏ మందులు వాడుతున్నారు?',
      type: 'multi',
      options: [
        { id: 'cp_med_1', en: 'Blood Pressure tablets (Telmisartan/Amlodipine/Atenolol)', hi: 'बीपी की गोलियां (Telmisartan/Amlodipine आदि)', te: 'బీపీ మాత్రలు' },
        { id: 'cp_med_2', en: 'Blood thinners / Aspirin / Clopidogrel (Ecosprin)', hi: 'खून पतला करने की दवा (Ecosprin/Aspirin)', te: 'రక్తం పల్చబడే మందులు (Ecosprin/Aspirin)' },
        { id: 'cp_med_3', en: 'Diabetes medicines (Metformin/Glimepiride/Insulin)', hi: 'डायबिटीज की दवाइयां (Metformin आदि)', te: 'షుగర్ మందులు' },
        { id: 'cp_med_4', en: 'Cholesterol medicine (Atorvastatin)', hi: 'कोलेस्ट्रॉल की दवा (Atorvastatin)', te: 'కొలెస్ట్రాల్ మందులు' },
        { id: 'cp_med_5', en: 'None / Not taking any regular medicines', hi: 'कोई नियमित दवा नहीं ले रहा', te: 'ఏ మందులు వాడటం లేదు' }
      ]
    },
    {
      id: 'cp_allergies',
      key: 'Drug Allergies',
      en: 'Do you have any known allergies to any medicines?',
      hi: 'क्या आपको किसी दवा से एलर्जी या रिएक्शन होता है?',
      te: 'మీకు ఏదైనా మందుల వల్ల అలర్జీ లేదా రియాక్షన్ ఉందా?',
      type: 'multi',
      options: [
        { id: 'cp_alg_1', en: 'Penicillin / Amoxicillin', hi: 'पेनिसिलिन / एमोक्सिसिलिन (Penicillin)', te: 'పెన్సిలిన్ / అమోక్సిసిలిన్' },
        { id: 'cp_alg_2', en: 'Painkillers (Diclofenac / Ibuprofen / NSAIDs)', hi: 'दर्द निवारक दवाएं (Diclofenac/Ibuprofen)', te: 'పెయిన్ కిల్లర్ మందులు (డైక్లోఫెనాక్)' },
        { id: 'cp_alg_3', en: 'Sulfa Drugs', hi: 'सल्फा दवाइयां (Sulfa)', te: 'సల్ఫా మందులు' },
        { id: 'cp_alg_4', en: 'No Known Drug Allergies (NKDA)', hi: 'किसी दवा से कोई एलर्जी नहीं है', te: 'ఎటువంటి మందుల అలర్జీలు లేవు' }
      ]
    }
  ],

  fever: [
    {
      id: 'fv_onset',
      key: 'Fever Duration',
      en: 'When did your fever start?',
      hi: 'बुखार कितने दिनों से आ रहा है?',
      te: 'జ్వరం ఎప్పటి నుండి వస్తుంది?',
      type: 'single',
      options: [
        { id: 'fv_on_1', en: 'Today (Started in last 24 hours)', hi: 'आज से (पिछले 24 घंटे में शुरू हुआ)', te: 'ఈ రోజు (గత 24 గంటల్లో ప్రారంభమైంది)' },
        { id: 'fv_on_2', en: '2 to 3 days ago', hi: '2 से 3 दिनों से', te: '2 నుండి 3 రోజుల క్రితం' },
        { id: 'fv_on_3', en: '5 to 7 days (Around 1 week)', hi: '5 से 7 दिनों से (लगभग 1 हफ्ता)', te: '5 నుండి 7 రోజులుగా', redFlagScore: 1 },
        { id: 'fv_on_4', en: 'More than 2 weeks (Prolonged fever)', hi: '2 सप्ताह से अधिक समय से (लंबे समय से बुखार)', te: '2 వారాల కంటే ఎక్కువ కాలంగా', redFlagScore: 2 }
      ]
    },
    {
      id: 'fv_pattern',
      key: 'Fever Pattern & Chills',
      en: 'What type of fever is it? Does it come with severe shivering/chills?',
      hi: 'बुखार किस तरह का है? क्या तेज ठंड और कंपकंपी छूटती है?',
      te: 'జ్వరం ఎలా వస్తుంది? చలి, వణుకుతో వస్తుందా?',
      type: 'single',
      options: [
        { id: 'fv_pat_1', en: 'High fever with severe shivering/chills (Comes & goes in spikes)', hi: 'तेज बुखार के साथ बहुत तेज ठंड व कंपकंपी (चढ़ता-उतरता है)', te: 'తీవ్రమైన చలి, వణుకుతో అధిక జ్వరం', redFlagScore: 2 },
        { id: 'fv_pat_2', en: 'Continuous high fever throughout the day', hi: 'दिन भर लगातार तेज बुखार बना रहता है', te: 'రోజంతా నిరంతరంగా ఉండే అధిక జ్వరం', redFlagScore: 2 },
        { id: 'fv_pat_3', en: 'Low-grade fever mostly in evenings with night sweats', hi: 'हल्का बुखार मुख्य रूप से शाम को और रात में पसीना', te: 'సాయంత్రం వేళల్లో వచ్చే స్వల్ప జ్వరం & రాత్రి చెమటలు', redFlagScore: 2 },
        { id: 'fv_pat_4', en: 'Mild warm sensation / Low fever', hi: 'हल्की गर्माहट / मामूली बुखार', te: 'సాధారణ స్వల్ప జ్వరం' }
      ]
    },
    {
      id: 'fv_warning_signs',
      key: 'Warning Signs (Dengue/Sepsis)',
      en: 'Have you noticed any of these warning signs: red skin rash, bleeding gums/nose, or severe persistent vomiting?',
      hi: 'क्या आपको इनमें से कोई गंभीर लक्षण हैं: त्वचा पर लाल दाने, मसूड़ों/नाक से खून, या बार-बार उल्टी?',
      te: 'ఈ ప్రమాదకర లక్షణాలు ఏమైనా ఉన్నాయా: చర్మంపై ఎర్రటి మచ్చలు, చిగుళ్ల నుండి రక్తస్రావం, లేదా తీవ్రమైన వాంతులు?',
      type: 'single',
      options: [
        { id: 'fv_wn_1', en: 'Yes, red skin spots / bleeding gums / vomiting blood', hi: 'हाँ, शरीर पर लाल चकत्ते / मसूड़ों से खून / उल्टी में खून', te: 'అవును, ఎర్రటి మచ్చలు / చిగుళ్ల నుండి రక్తం / తీవ్రమైన వాంతులు', redFlagScore: 5 },
        { id: 'fv_wn_2', en: 'Severe body pain, joint pain & pain behind eyes (Break-bone fever)', hi: 'जोड़ों व हड्डियों में असहनीय दर्द और आंखों के पीछे दर्द', te: 'తీవ్రమైన కండరాలు, కీళ్ల నొప్పులు & కళ్ల వెనుక నొప్పి', redFlagScore: 2 },
        { id: 'fv_wn_3', en: 'None of these warning signs', hi: 'इनमें से कोई गंभीर लक्षण नहीं है', te: 'ఈ తీవ్రమైన లక్షణాలు ఏవీ లేవు' }
      ]
    },
    {
      id: 'fv_respiratory',
      key: 'Respiratory Symptoms',
      en: 'Do you have cough, sore throat, or breathing difficulty along with fever?',
      hi: 'क्या बुखार के साथ खांसी, गले में खराश या सांस लेने में परेशानी है?',
      te: 'జ్వరంతో పాటు దగ్గు, గొంతు నొప్పి లేదా ఆయాసం ఉందా?',
      type: 'single',
      options: [
        { id: 'fv_resp_1', en: 'Yes, severe breathing difficulty or chest congestion', hi: 'हाँ, सांस लेने में बहुत कठिनाई और सीने में जकड़न', te: 'అవును, శ్వాస తీసుకోవడంలో తీవ్ర ఇబ్బంది', redFlagScore: 3 },
        { id: 'fv_resp_2', en: 'Mild cough and sore throat (Cold/Flu symptoms)', hi: 'हल्की खांसी और गले में खराश (सामान्य सर्दी-जुकाम)', te: 'సాధారణ దగ్గు మరియు గొంతు నొప్పి' },
        { id: 'fv_resp_3', en: 'No cough or throat issues', hi: 'खांसी या गले में कोई तकलीफ नहीं', te: 'దగ్గు లేదా గొంతు సమస్యలు లేవు' }
      ]
    },
    {
      id: 'fv_urinary_gut',
      key: 'Urinary & Stomach Symptoms',
      en: 'Do you have burning urination, stomach pain, or loose motions (diarrhea)?',
      hi: 'क्या पेशाब में जलन, पेट में तेज दर्द या दस्त (Loose motion) की समस्या है?',
      te: 'మూత్రంలో మంట, కడుపు నొప్పి లేదా విరేచనాలు ఉన్నాయా?',
      type: 'multi',
      options: [
        { id: 'fv_ug_1', en: 'Burning sensation and pain while passing urine', hi: 'पेशाब करते समय तेज जलन और दर्द', te: 'మూత్ర విసర్జన సమయంలో తీవ్ర మంట' },
        { id: 'fv_ug_2', en: 'Watery loose motions > 4-5 times a day', hi: 'दिन में 4-5 बार से अधिक पानी जैसे पतले दस्त', te: 'రోజుకు 4-5 సార్లు నీళ్ల విరేచనాలు', redFlagScore: 1 },
        { id: 'fv_ug_3', en: 'Severe abdominal pain / cramps', hi: 'पेट में तेज मरोड़ या दर्द', te: 'తీవ్రమైన కడుపు నొప్పి' },
        { id: 'fv_ug_4', en: 'None of these', hi: 'इनमें से कोई नहीं', te: 'వీటిలో ఏవీ లేవు' }
      ]
    },
    {
      id: 'fv_past_meds',
      key: 'Medicines Taken & Allergies',
      en: 'Have you taken Paracetamol or any antibiotic? Any known drug allergies?',
      hi: 'क्या आपने पैरासिटामोल या कोई एंटीबायोटिक लिया है? क्या किसी दवा से एलर्जी है?',
      te: 'పారాసిటమాల్ లేదా యాంటీబయాటిక్ వాడారా? ఏదైనా మందుల అలర్జీ ఉందా?',
      type: 'multi',
      options: [
        { id: 'fv_pm_1', en: 'Took Paracetamol (Temperature came down temporarily)', hi: 'पैरासिटामोल ली है (बुखार कुछ देर के लिए उतरा था)', te: 'పారాసిటమాల్ తీసుకున్నాను (కొంత ఉపశమనం లభించింది)' },
        { id: 'fv_pm_2', en: 'Took Antibiotics from local pharmacy without prescription', hi: 'दुकान से बिना पर्चे की एंटीबायोटिक ली है', te: 'యాంటీబయాటిక్ మాత్రలు వాడాను' },
        { id: 'fv_pm_3', en: 'Allergic to Penicillin / Sulfa / Painkillers', hi: 'पेनिसिलिन / सल्फा / दर्दनिवारक से एलर्जी है', te: 'పెన్సిలిన్ / సల్ఫా మందుల అలర్జీ ఉంది' },
        { id: 'fv_pm_4', en: 'No Known Drug Allergies (NKDA)', hi: 'किसी दवा से एलर्जी नहीं है', te: 'ఎటువంటి మందుల అలర్జీ లేదు' }
      ]
    }
  ],

  headache: [
    {
      id: 'ha_onset',
      key: 'Onset & Severity',
      en: 'How did the headache start?',
      hi: 'सिरदर्द कैसे शुरू हुआ?',
      te: 'తలనొప్పి ఎలా ప్రారంభమైంది?',
      type: 'single',
      options: [
        { id: 'ha_on_1', en: 'Sudden explosive "worst headache of my life" (Thunderclap)', hi: 'अचानक बहुत तेज धमाके जैसा असहनीय सिरदर्द (जीवन का सबसे तेज दर्द)', te: 'అకస్మాత్తుగా తీవ్రమైన పిడుగుపడ్డట్లు అత్యంత భయంకరమైన నొప్పి', redFlagScore: 5 },
        { id: 'ha_on_2', en: 'Gradual throbbing pain developing over hours', hi: 'धीरे-धीरे बढ़ता हुआ धड़कन जैसा तेज सिरदर्द', te: 'క్రమంగా పెరుగుతున్న నొప్పి' },
        { id: 'ha_on_3', en: 'Dull tight band-like pressure around forehead', hi: 'माथे पर पट्टी जैसी जकड़न व हल्का भारीपन', te: 'నుదుటి చుట్టూ బిగుతుగా ఉండే ఒత్తిడి' }
      ]
    },
    {
      id: 'ha_neuro',
      key: 'Neurological Red Flags',
      en: 'Are you experiencing any of these: neck stiffness with high fever, weakness on one side of body, slurred speech, or vomiting?',
      hi: 'क्या आपको गर्दन में अकड़न के साथ बुखार, चेहरे या हाथ में कमजोरी, बोलने में लड़खड़ाहट या उल्टी है?',
      te: 'మెడ బిగుసుకుపోవడం, ఒకవైపు చేయి/ముఖం బలహీనపడటం, మాట తడబడటం లేదా వాంతులు ఉన్నాయా?',
      type: 'single',
      options: [
        { id: 'ha_neu_1', en: 'Yes, sudden weakness in arm/face or slurred speech (Stroke risk)', hi: 'हाँ, हाथ/चेहरे में कमजोरी या बोली में लड़खड़ाहट', te: 'అవును, చేయి/ముఖం చచ్చుబడటం లేదా మాటలో తడబాటు', redFlagScore: 5 },
        { id: 'ha_neu_2', en: 'Yes, stiff neck with fever and severe light sensitivity', hi: 'हाँ, तेज बुखार के साथ गर्दन अकड़ गई है और रोशनी बर्दाश्त नहीं हो रही', te: 'అవును, జ్వరంతో మెడ బిగుతుగా మారడం & వెలుతురు చూడలేకపోవడం', redFlagScore: 4 },
        { id: 'ha_neu_3', en: 'Vision blurriness / Seeing flashing zigzag lights', hi: 'आंखों के आगे चमक या धुंधला दिखाई देना (माइग्रेन जैसा)', te: 'కళ్లు మసకబారడం / కాంతి మెరుపులు' },
        { id: 'ha_neu_4', en: 'None of these symptoms', hi: 'इनमें से कोई लक्षण नहीं है', te: 'ఈ లక్షణాలు ఏవీ లేవు' }
      ]
    },
    {
      id: 'ha_history',
      key: 'Past Medical History',
      en: 'Do you have a history of Migraine, High Blood Pressure, or recent head injury?',
      hi: 'क्या आपको माइग्रेन, हाई बीपी या हाल ही में सिर में चोट लगी थी?',
      te: 'మీకు మైగ్రేన్, హై బీపీ లేదా ఇటీవల తలకు దెబ్బ తగిలిన చరిత్ర ఉందా?',
      type: 'multi',
      options: [
        { id: 'ha_hx_1', en: 'History of High Blood Pressure (Hypertension)', hi: 'हाई ब्लड प्रेशर की समस्या है', te: 'హై బ్లడ్ ప్రెషర్ ఉంది', redFlagScore: 1 },
        { id: 'ha_hx_2', en: 'Known Migraine patient', hi: 'माइग्रेन की पुरानी बीमारी है', te: 'గతంలో మైగ్రేన్ సమస్య ఉంది' },
        { id: 'ha_hx_3', en: 'Recent fall or head injury within last 2 weeks', hi: 'पिछले 2 हफ्तों में सिर में चोट या गिरना हुआ था', te: 'ఇటీవల తలకు గాయం అయ్యింది', redFlagScore: 3 },
        { id: 'ha_hx_4', en: 'None of the above', hi: 'इनमें से कोई नहीं', te: 'పైవేవీ లేవు' }
      ]
    }
  ],

  abdominal_pain: [
    {
      id: 'ab_location',
      key: 'Pain Location',
      en: 'Where in your stomach / abdomen is the pain located?',
      hi: 'पेट में दर्द किस जगह पर है?',
      te: 'కడుపులో నొప్పి ఖచ్చితంగా ఎక్కడ ఉంది?',
      type: 'single',
      options: [
        { id: 'ab_loc_1', en: 'Right lower side of abdomen (Sharp / Appendicitis risk)', hi: 'पेट के निचले दाहिने हिस्से में (तेज दर्द)', te: 'కడుపు కుడివైపు కింది భాగంలో (తీవ్రమైన నొప్పి)', redFlagScore: 3 },
        { id: 'ab_loc_2', en: 'Upper middle abdomen (Epigastrium / Acidity / Gallbladder)', hi: 'पेट के ऊपरी बीच के हिस्से में (जलन / भारीपन)', te: 'కడుపు పైభాగం మధ్యలో' },
        { id: 'ab_loc_3', en: 'Lower abdomen / Pelvis (Bladder / Reproductive)', hi: 'पेट के निचले हिस्से / पेडू में', te: 'కడుపు కింది భాగంలో' },
        { id: 'ab_loc_4', en: 'Diffuse pain all over abdomen with bloating', hi: 'पूरे पेट में फैला हुआ दर्द और पेट फूलना', te: 'మొత్తం కడుపు అంతటా నొప్పి మరియు ఉబ్బరం', redFlagScore: 2 }
      ]
    },
    {
      id: 'ab_red_flags',
      key: 'Acute Abdomen Warning Signs',
      en: 'Are you experiencing any of these: vomiting blood / coffee-ground vomit, black tarry stools, yellow eyes (jaundice), or unable to pass gas?',
      hi: 'क्या आपको उल्टी में खून, काला मल, आंखों में पीलापन (पीलिया) या गैस/मल बिल्कुल न पास होने की समस्या है?',
      te: 'వాంతిలో రక్తం, నల్లటి మలం, కళ్లు పచ్చబడటం (కామెర్లు) లేదా గ్యాస్/మలం వెళ్లకపోవడం వంటివి ఉన్నాయా?',
      type: 'single',
      options: [
        { id: 'ab_rf_1', en: 'Yes, vomiting blood or black tarry stools (GI bleeding)', hi: 'हाँ, उल्टी में खून या काला मल आ रहा है', te: 'అవును, వాంతిలో రక్తం లేదా నల్లటి మలం', redFlagScore: 5 },
        { id: 'ab_rf_2', en: 'Severe vomiting & completely unable to pass gas or stool (Obstruction)', hi: 'लगातार उल्टी और पेट फूलना, गैस बिल्कुल पास नहीं हो रही', te: 'తీవ్రమైన వాంతులు మరియు మలం/గ్యాస్ పూర్తిగా నిలిచిపోవడం', redFlagScore: 4 },
        { id: 'ab_rf_3', en: 'Yellow eyes / Dark yellow urine with pain (Jaundice)', hi: 'आंखों में पीलापन और गहरा पेशाब (पीलिया के लक्षण)', te: 'కళ్లు పచ్చబడటం & పచ్చటి మూత్రం', redFlagScore: 2 },
        { id: 'ab_rf_4', en: 'None of these danger signs', hi: 'इनमें से कोई गंभीर लक्षण नहीं है', te: 'ఈ తీవ్రమైన లక్షణాలు ఏవీ లేవు' }
      ]
    }
  ],

  cough: [
    {
      id: 'cg_duration',
      key: 'Cough Duration',
      en: 'How long have you had this cough?',
      hi: 'आपको यह खांसी कितने समय से आ रही है?',
      te: 'ఈ దగ్గు ఎంతకాలంగా ఉంది?',
      type: 'single',
      options: [
        { id: 'cg_dur_1', en: 'More than 2 weeks (TB Surveillance Screening Marker)', hi: '2 सप्ताह से अधिक समय से (लगातार पुरानी खांसी)', te: '2 వారాల కంటే ఎక్కువ కాలంగా', redFlagScore: 3 },
        { id: 'cg_dur_2', en: '1 to 2 weeks', hi: '1 से 2 सप्ताह से', te: '1 నుండి 2 వారాలుగా' },
        { id: 'cg_dur_3', en: '3 to 5 days (Recent cold/flu)', hi: '3 से 5 दिनों से (ताजा जुकाम/खांसी)', te: '3 నుండి 5 రోజులుగా' },
        { id: 'cg_dur_4', en: '1 to 2 days', hi: '1 से 2 दिनों से', te: '1 నుండి 2 రోజులు' }
      ]
    },
    {
      id: 'cg_blood_tb',
      key: 'Blood in Sputum & TB Symptoms',
      en: 'Have you seen blood in your sputum/cough, or had evening fever and unintentional weight loss?',
      hi: 'क्या बलगम में खून आया है, या शाम को बुखार और वजन में अचानक कमी हुई है?',
      te: 'కఫంలో రక్తం పడటం, సాయంత్రం జ్వరం లేదా వేగంగా బరువు తగ్గడం జరిగిందా?',
      type: 'single',
      options: [
        { id: 'cg_tb_1', en: 'Yes, coughing up blood or blood streaks in sputum (Hemoptysis)', hi: 'हाँ, खांसी/बलगम में खून या खून की धारियां आई हैं', te: 'అవును, దగ్గినప్పుడు కఫంలో రక్తం పడుతుంది', redFlagScore: 5 },
        { id: 'cg_tb_2', en: 'Cough > 2 weeks + evening fever + night sweats (TB Suspect)', hi: '2 हफ्ते से ज्यादा खांसी + शाम का बुखार + रात में पसीना', te: '2 వారాల పైగా దగ్గు + సాయంత్రం జ్వరం + రాత్రి చెమటలు', redFlagScore: 3 },
        { id: 'cg_tb_3', en: 'Wet cough with thick yellow/green phlegm only', hi: 'केवल गाढ़ा पीला/हरा बलगम आता है', te: 'కేవలం పసుపు/ఆకుపచ్చ కఫం మాత్రమే' },
        { id: 'cg_tb_4', en: 'Dry irritating cough without phlegm or blood', hi: 'सूखी खांसी (बिना बलगम या खून के)', te: 'పొడి దగ్గు' }
      ]
    },
    {
      id: 'cg_breathlessness',
      key: 'Wheezing & Breathlessness',
      en: 'Do you have wheezing (whistling chest sound) or difficulty breathing?',
      hi: 'क्या छाती से सीटी जैसी आवाज (घरघराहट) या सांस फूलने की शिकायत है?',
      te: 'ఛాతీలో పిల్లికూతలు లేదా శ్వాస తీసుకోవడంలో ఇబ్బంది ఉందా?',
      type: 'single',
      options: [
        { id: 'cg_wh_1', en: 'Yes, acute wheezing attack & difficulty speaking full sentences', hi: 'हाँ, तेज घरघराहट और सांस फूलने से बात करने में कठिनाई', te: 'అవును, తీవ్రమైన ఆయాసం & మాట్లాడలేకపోవడం', redFlagScore: 3 },
        { id: 'cg_wh_2', en: 'Mild wheezing at night or with cold weather', hi: 'रात में या ठंड के मौसम में हल्की घरघराहट', te: 'రాత్రి వేళల్లో స్వల్ప ఆయాసం' },
        { id: 'cg_wh_3', en: 'No wheezing or breathing issues', hi: 'सांस लेने में कोई तकलीफ या आवाज नहीं है', te: 'ఆయాసం లేదా శబ్దాలు ఏవీ లేవు' }
      ]
    }
  ],

  other: [
    {
      id: 'ot_describe',
      key: 'Chief Complaint Description',
      en: 'Please describe your main complaint or health issue today:',
      hi: 'कृपया अपनी मुख्य तकलीफ या स्वास्थ्य समस्या का विवरण दें:',
      te: 'దయచేసి మీ ప్రధాన ఆరోగ్య సమస్యను వివరించండి:',
      type: 'text_or_choice',
      options: [
        { id: 'ot_opt_1', en: 'General body weakness & exhaustion', hi: 'शरीर में बहुत कमजोरी व थकान', te: 'శరీరంలో తీవ్ర బలహీనత & అలసట' },
        { id: 'ot_opt_2', en: 'Eye, ear or throat problem', hi: 'आंख, कान या गले की समस्या', te: 'కంటి, చెవి లేదా గొంతు సమస్య' },
        { id: 'ot_opt_3', en: 'Dizziness, nausea or uneasiness', hi: 'चक्कर आना, जी मिचलाना या बेचैनी', te: 'తలతిరగడం, వికారం లేదా కంగారు' },
        { id: 'ot_opt_4', en: 'Routine follow-up / Medication refill', hi: 'पुरानी बीमारी की नियमित जांच / दवा लिखवाना', te: 'సాధారణ తనిఖీ / మందుల కొరకు' }
      ]
    },
    {
      id: 'ot_duration',
      key: 'Duration',
      en: 'How long have you been having this problem?',
      hi: 'यह तकलीफ कितने समय से है?',
      te: 'ఈ సమస్య ఎంతకాలంగా ఉంది?',
      type: 'single',
      options: [
        { id: 'ot_dur_1', en: 'Started today (Sudden onset)', hi: 'आज से शुरू हुआ (अचानक)', te: 'ఈ రోజే ప్రారంభమైంది' },
        { id: 'ot_dur_2', en: '2 to 3 days', hi: '2 से 3 दिन', te: '2 నుండి 3 రోజులు' },
        { id: 'ot_dur_3', en: '1 to 2 weeks', hi: '1 से 2 हफ्ते', te: '1 నుండి 2 వారాలు' },
        { id: 'ot_dur_4', en: 'More than a month (Chronic)', hi: '1 महीने से अधिक (पुरानी समस्या)', te: 'నెల రోజుల కంటే ఎక్కువ' }
      ]
    },
    {
      id: 'ot_severity',
      key: 'Severity',
      en: 'How severe is the discomfort (1 to 10 scale)?',
      hi: 'तकलीफ की गंभीरता कितनी है (1 से 10 के पैमाने पर)?',
      te: 'సమస్య తీవ్రత ఎంత (1 నుండి 10 స్కేలుపై)?',
      type: 'scale',
      options: [
        { id: 'ot_sev_1', en: '1-3 (Mild)', hi: '1-3 (हल्की)', te: '1-3 (స్వల్పం)' },
        { id: 'ot_sev_2', en: '4-6 (Moderate)', hi: '4-6 (मध्यम)', te: '4-6 (మధ్యస్థం)' },
        { id: 'ot_sev_3', en: '7-8 (Severe)', hi: '7-8 (गंभीर)', te: '7-8 (తీవ్రం)', redFlagScore: 2 },
        { id: 'ot_sev_4', en: '9-10 (Unbearable)', hi: '9-10 (असहनीय)', te: '9-10 (భరించలేనిది)', redFlagScore: 3 }
      ]
    }
  ],

  back_pain: [
    {
      id: 'bk_duration',
      key: 'Onset & Duration',
      en: 'When did your back pain start?',
      hi: 'कमर या पीठ में दर्द कब शुरू हुआ?',
      te: 'నడుము లేదా వీపు నొప్పి ఎప్పుడు ప్రారంభమైంది?',
      type: 'single',
      options: [
        { id: 'bk_dur_1', en: 'Started suddenly today after heavy lifting or bending', hi: 'आज भारी वजन उठाने या झुकने के बाद अचानक शुरू हुआ', te: 'ఈ రోజు బరువులు ఎత్తిన తర్వాత లేదా వంగినప్పుడు అకస్మాత్తుగా మొదలైంది' },
        { id: 'bk_dur_2', en: '2 to 5 days ago', hi: '2 से 5 दिन पहले', te: '2 నుండి 5 రోజుల క్రితం' },
        { id: 'bk_dur_3', en: '1 to 2 weeks ago', hi: '1 से 2 सप्ताह पहले', te: '1 నుండి 2 వారాల క్రితం' },
        { id: 'bk_dur_4', en: 'More than a month (Chronic backache)', hi: '1 महीने से अधिक समय से (पुरानी कमर दर्द)', te: 'నెల రోజుల కంటే ఎక్కువ కాలంగా (దీర్ఘకాలిక నొప్పి)' }
      ]
    },
    {
      id: 'bk_radiation',
      key: 'Radiation & Sciatica',
      en: 'Does the pain shoot down below your knee into your calf, foot, or toes (Sciatica)?',
      hi: 'क्या दर्द कूल्हे से होते हुए पैर, पिण्डली या पंजे तक नीचे जा रहा है (सायटिका)?',
      te: 'నొప్పి నడుము నుండి కాలు, పిక్క లేదా పాదం వరకు పాకుతుందా (సయాటికా)?',
      type: 'single',
      options: [
        { id: 'bk_rad_1', en: 'Yes, sharp shooting pain & tingling/numbness down the leg', hi: 'हाँ, पैर में तेज करंट जैसा दर्द व सुन्नपन (Tingling/Numbness)', te: 'అవును, కాలులో తీవ్రమైన లాగడం, తిమ్మిరి మరియు సూదులు గుచ్చినట్లు ఉండటం', redFlagScore: 2 },
        { id: 'bk_rad_2', en: 'Pain stays strictly in lower back without going to legs', hi: 'दर्द केवल कमर में रहता है, पैर में नीचे नहीं जाता', te: 'నొప్పి కేవలం నడుము వరకే పరిమితం' },
        { id: 'bk_rad_3', en: 'Upper back / Neck & shoulder blade pain', hi: 'पीठ के ऊपरी हिस्से / गर्दन और कंधे में दर्द', te: 'వీపు పైభాగం / మెడ మరియు భుజం నొప్పి' }
      ]
    },
    {
      id: 'bk_red_flags',
      key: 'Spinal Red Flags (Cauda Equina)',
      en: 'Do you have any loss of bowel/bladder control, sudden weakness in legs, or high fever with back pain?',
      hi: 'क्या आपको पेशाब/मल पर नियंत्रण खोने, पैरों में अचानक कमजोरी, या बुखार के साथ कमर दर्द है?',
      te: 'మూత్రం/మలం ఆపుకోలేకపోవడం, కాళ్లు చచ్చుబడటం లేదా జ్వరంతో కూడిన నడుము నొప్పి ఉందా?',
      type: 'single',
      options: [
        { id: 'bk_rf_1', en: 'Yes, loss of urine/stool control or numbness around groin (Cauda Equina Alert)', hi: 'हाँ, पेशाब/मल रोकने में असमर्थता या जांघों के बीच सुन्नपन', te: 'అవును, మూత్రం/మలం నియంత్రణ కోల్పోవడం (అత్యవసర హెచ్చరిక)', redFlagScore: 5 },
        { id: 'bk_rf_2', en: 'Yes, sudden foot drop / unable to lift foot while walking', hi: 'हाँ, पैर का पंजा उठाने में असमर्थता / चलने में लड़खड़ाहट', te: 'అవును, నడుస్తున్నప్పుడు పాదం లేపలేకపోవడం', redFlagScore: 3 },
        { id: 'bk_rf_3', en: 'None of these warning signs', hi: 'इनमें से कोई गंभीर लक्षण नहीं है', te: 'ఈ తీవ్రమైన లక్షణాలు ఏవీ లేవు' }
      ]
    },
    {
      id: 'bk_history_meds',
      key: 'Past Spine History & Medicines',
      en: 'Do you have a history of Slip Disc, Osteoporosis (Weak bones), or take painkillers regularly?',
      hi: 'क्या आपको पहले स्लिप डिस्क, कमजोर हड्डियों की समस्या है या दर्द निवारक दवा लेते हैं?',
      te: 'గతంలో స్లిప్ డిస్క్, ఎముకల బలహీనత ఉందా లేదా పెయిన్ కిల్లర్స్ వాడుతున్నారా?',
      type: 'multi',
      options: [
        { id: 'bk_hm_1', en: 'History of Slip Disc / Lumbar Spondylosis', hi: 'स्लिप डिस्क या स्पोंडिलाइटिस की पुरानी बीमारी', te: 'స్లిప్ డిస్క్ / స్పాండిలైటిస్ సమస్య' },
        { id: 'bk_hm_2', en: 'Taking Painkillers / Muscle relaxants (Diclofenac/Paracetamol)', hi: 'दर्द निवारक या मांसपेशियों को आराम देने वाली दवा ले रहे हैं', te: 'పెయిన్ కిల్లర్ మందులు వాడుతున్నాను' },
        { id: 'bk_hm_3', en: 'Osteoporosis / Calcium / Vitamin D3 deficiency', hi: 'कमजोर हड्डियां / कैल्शियम व विटामिन डी की कमी', te: 'ఎముకల బలహీనత / విటమిన్ డి లోపం' },
        { id: 'bk_hm_4', en: 'No prior spine history / No medications', hi: 'पहले कोई रीढ़ की समस्या नहीं / कोई दवा नहीं', te: 'గతంలో ఎటువంటి సమస్యలు లేవు' }
      ]
    }
  ],

  joint_pain: [
    {
      id: 'jt_location',
      key: 'Affected Joints',
      en: 'Which joints are experiencing severe pain or swelling?',
      hi: 'किन जोड़ों में तेज दर्द या सूजन है?',
      te: 'ఏ కీళ్లలో తీవ్రమైన నొప్పి లేదా వాపు ఉంది?',
      type: 'multi',
      options: [
        { id: 'jt_loc_1', en: 'Knee joints (Difficulty standing or climbing stairs)', hi: 'घुटने के जोड़ (खड़े होने या सीढ़ी चढ़ने में परेशानी)', te: 'మోకాళ్ల కీళ్లు (నడవడానికి, మెట్లు ఎక్కడానికి కష్టం)' },
        { id: 'jt_loc_2', en: 'Big toe / Foot / Ankle (Sudden severe throbbing - Gout suspect)', hi: 'पैर का अंगूठा / टखना (अचानक तेज दर्द - यूरिक एसिड/गाउट)', te: 'కాలి బొటనవేలు / మడమ (తీవ్రమైన పోటు - గౌట్ అనుమానం)', redFlagScore: 2 },
        { id: 'jt_loc_3', en: 'Hands / Fingers / Wrists on both sides (Symmetric)', hi: 'दोनों हाथों की उंगलियां और कलाई (गठिया/संधिवाता)', te: 'రెండు చేతుల వేళ్లు మరియు మణికట్లు' },
        { id: 'jt_loc_4', en: 'Shoulder / Hip / Multiple joints across body', hi: 'कंधा / कूल्हा / शरीर के कई जोड़ों में एक साथ', te: 'భుజం / తుంటి / బహుళ కీళ్లలో నొప్పి' }
      ]
    },
    {
      id: 'jt_stiffness',
      key: 'Morning Stiffness & Warmth',
      en: 'Do you have morning joint stiffness lasting more than 30-45 minutes, or hot red swelling?',
      hi: 'क्या सुबह उठने पर जोड़ों में 30 मिनट से अधिक जकड़न रहती है या गर्म लाल सूजन है?',
      te: 'ఉదయం లేవగానే కీళ్లు 30 నిమిషాలకు పైగా బిగుసుకుపోవడం లేదా ఎర్రటి వేడి వాపు ఉందా?',
      type: 'single',
      options: [
        { id: 'jt_stf_1', en: 'Yes, marked morning stiffness lasting over 1 hour (Rheumatoid suspect)', hi: 'हाँ, सुबह 1 घंटे से ज्यादा जोड़ों में अकड़न रहती है', te: 'అవును, ఉదయం 1 గంటకు పైగా కీళ్లు బిగుసుకుపోతాయి', redFlagScore: 2 },
        { id: 'jt_stf_2', en: 'Yes, sudden hot, red, extremely swollen joint (Acute Gout / Infection)', hi: 'हाँ, जोड़ बहुत लाल, गर्म और अत्यधिक सूजा हुआ है', te: 'అవును, కీలు బాగా ఎర్రబడి, వేడిగా మరియు విపరీతంగా వాచింది', redFlagScore: 3 },
        { id: 'jt_stf_3', en: 'Pain increases with walking/activity and improves with rest', hi: 'चलने-फिरने पर दर्द बढ़ता है, आराम करने पर घटता है (Osteoarthritis)', te: 'నడిచినప్పుడు నొప్పి పెరుగుతుంది, విశ్రాంతితో తగ్గుతుంది' }
      ]
    },
    {
      id: 'jt_history',
      key: 'Uric Acid & Past Arthritis History',
      en: 'Do you have High Uric Acid, Rheumatoid Arthritis, or Kidney problems?',
      hi: 'क्या आपको यूरिक एसिड, गठिया (Arthritis) या किडनी की बीमारी है?',
      te: 'యూరిక్ యాసిడ్, ఆర్థరైటిస్ లేదా కిడ్నీ సమస్యలు ఏమైనా ఉన్నాయా?',
      type: 'multi',
      options: [
        { id: 'jt_hx_1', en: 'High Uric Acid / Diagnosed Gout', hi: 'यूरिक एसिड बढ़ा हुआ है / गाउट की बीमारी', te: 'యూరిక్ యాసిడ్ పెరిగింది / గౌట్ సమస్య' },
        { id: 'jt_hx_2', en: 'Rheumatoid Arthritis / Chikungunya joint pain', hi: 'रुमेटॉयड गठिया / चिकनगुनिया के बाद का जोड़ों का दर्द', te: 'రుమటాయిడ్ ఆర్థరైటిస్ / చికెన్ గున్యా తర్వాత కీళ్ల నొప్పులు' },
        { id: 'jt_hx_3', en: 'Taking Painkiller tablets regularly (Diclofenac/Aceclofenac)', hi: 'नियमित रूप से दर्द निवारक दवाइयां ले रहे हैं', te: 'రోజూ పెయిన్ కిల్లర్ మాత్రలు వాడుతున్నాను' },
        { id: 'jt_hx_4', en: 'No past joint disease history', hi: 'पहले कोई जोड़ों की बीमारी नहीं रही', te: 'గతంలో కీళ్ల జబ్బులు లేవు' }
      ]
    }
  ],

  skin_rash: [
    {
      id: 'sk_type',
      key: 'Rash Appearance & Itching',
      en: 'What does the skin rash look like?',
      hi: 'त्वचा पर किस प्रकार के दाने या चकत्ते हैं?',
      te: 'చర్మంపై దద్దుర్లు లేదా మచ్చలు ఎలా ఉన్నాయి?',
      type: 'single',
      options: [
        { id: 'sk_tp_1', en: 'Red swollen raised itchy welts (Hives / Urticaria allergy)', hi: 'उभरे हुए लाल दाने व तेज खुजली (पित्ती / एलर्जी)', te: 'దురదతో కూడిన ఎర్రటి దద్దుర్లు (అలర్జీ)' },
        { id: 'sk_tp_2', en: 'Fluid-filled blisters / Peeling skin / Raw sores', hi: 'पानी भरे छाले / त्वचा की चमड़ी उतरना', te: 'నీటి బొబ్బలు / చర్మం పొట్టు రాలడం', redFlagScore: 3 },
        { id: 'sk_tp_3', en: 'Dry scaly patches with silvery scales / Ringworm', hi: 'सूखी पपड़ीदार त्वचा / दाद-खाज (Ringworm/Fungal)', te: 'పొడి పొలుసులు / తామర (ఫంగల్ ఇన్ఫెక్షన్)' },
        { id: 'sk_tp_4', en: 'Painful boils / Pus-filled pimples / Red swelling', hi: 'दर्दनाक फुंसी / मवाद वाले दाने / लाल सूजन', te: 'చీము గడ్డలు / నొప్పి కలిగించే మొటిమలు' }
      ]
    },
    {
      id: 'sk_red_flags',
      key: 'Anaphylaxis & Severe Drug Reaction Alert',
      en: 'Are you experiencing lip/facial swelling, tongue swelling, difficulty swallowing or shortness of breath?',
      hi: 'क्या होंठ/चेहरे पर सूजन, जीभ में भारीपन, सांस लेने में तकलीफ या निगलने में दर्द है?',
      te: 'పెదవులు/ముఖం వాపు, నాలుక వాపు, శ్వాస తీసుకోవడంలో లేదా మింగడంలో ఇబ్బంది ఉందా?',
      type: 'single',
      options: [
        { id: 'sk_rf_1', en: 'Yes, lip/face swelling & throat tightness / breathlessness (Emergency Anaphylaxis)', hi: 'हाँ, होंठ/चेहरे पर सूजन और सांस फूलना (आपातकालीन एलर्जी)', te: 'అవును, ముఖం/పెదవుల వాపు & ఆయాసం (అత్యవసర అలర్జీ హెచ్చరిక)', redFlagScore: 5 },
        { id: 'sk_rf_2', en: 'Rash appeared immediately after taking a new medicine/injection', hi: 'नई दवा या इंजेक्शन लेने के तुरंत बाद दाने निकले', te: 'కొత్త మందు లేదా ఇంజెక్షన్ తీసుకున్న వెంటనే దద్దుర్లు వచ్చాయి', redFlagScore: 3 },
        { id: 'sk_rf_3', en: 'Only itching on skin without any facial swelling or breathing issues', hi: 'केवल त्वचा पर खुजली है, चेहरे पर सूजन या सांस की तकलीफ नहीं', te: 'కేవలం చర్మంపై దురద మాత్రమే ఉంది' }
      ]
    }
  ],

  urinary_trouble: [
    {
      id: 'ur_symptoms',
      key: 'Urinary Symptoms',
      en: 'What urinary problem are you experiencing?',
      hi: 'पेशाब में क्या मुख्य तकलीफ हो रही है?',
      te: 'మూత్ర విసర్జనలో ప్రధాన సమస్య ఏమిటి?',
      type: 'multi',
      options: [
        { id: 'ur_sym_1', en: 'Severe burning sensation and pain while urinating (UTI)', hi: 'पेशाब करते समय तेज जलन और दर्द', te: 'మూత్ర విసర్జన సమయంలో తీవ్రమైన మంట మరియు నొప్పి' },
        { id: 'ur_sym_2', en: 'Passing red / cola-colored blood in urine (Hematuria)', hi: 'पेशाब में लाल खून आना (रक्तस्राव)', te: 'మూత్రంలో రక్తం పడటం', redFlagScore: 4 },
        { id: 'ur_sym_3', en: 'Very frequent urge to urinate every few minutes with poor flow', hi: 'बार-बार पेशाब आने का अहसास और कम धार निकलना', te: 'తరచుగా మూత్రం రావడం & ధార తక్కువగా ఉండటం' },
        { id: 'ur_sym_4', en: 'Completely unable to pass urine despite severe bladder pressure', hi: 'पेशाब का बिल्कुल न उतरना और मूत्राशय में तेज दर्द (रुकावट)', te: 'మూత్రం పూర్తిగా బంధింపబడటం', redFlagScore: 4 }
      ]
    },
    {
      id: 'ur_stone_fever',
      key: 'Kidney Stone Pain & Fever',
      en: 'Do you have sudden excruciating pain in the side/flank shooting to the groin, or high fever with chills?',
      hi: 'क्या कमर के बगल (Flank) में अचानक असहनीय पथरी जैसा दर्द है या ठंड लगकर तेज बुखार है?',
      te: 'నడుము పక్క భాగంలో తీవ్రమైన కిడ్నీ రాయి నొప్పి లేదా చలితో కూడిన జ్వరం ఉందా?',
      type: 'single',
      options: [
        { id: 'ur_st_1', en: 'Yes, sudden severe flank pain radiating to groin (Kidney stone attack)', hi: 'हाँ, कमर के एक तरफ असहनीय तेज दर्द (गुर्दे की पथरी का दर्द)', te: 'అవును, పక్కటెముకల కింద తీవ్రమైన నొప్పి (కిడ్నీ రాయి నొప్పి)', redFlagScore: 3 },
        { id: 'ur_st_2', en: 'High fever with shivering and burning urination (Kidney infection / Sepsis)', hi: 'तेज बुखार, कंपकंपी और पेशाब में जलन (किडनी इन्फेक्शन)', te: 'తీవ్ర జ్వరం, వణుకు మరియు మూత్రంలో మంట (కిడ్నీ ఇన్ఫెక్షన్)', redFlagScore: 4 },
        { id: 'ur_st_3', en: 'Mild burning without flank pain or high fever', hi: 'हल्की जलन है, कोई तेज दर्द या बुखार नहीं', te: 'స్వల్ప మంట మాత్రమే ఉంది' }
      ]
    }
  ],

  general_weakness: [
    {
      id: 'gw_symptoms',
      key: 'Fatigue & Dizziness',
      en: 'What are your primary symptoms of weakness?',
      hi: 'कमजोरी के मुख्य लक्षण क्या हैं?',
      te: 'బలహీనత యొక్క ప్రధాన లక్షణాలు ఏమిటి?',
      type: 'multi',
      options: [
        { id: 'gw_sym_1', en: 'Extreme fatigue and exhaustion even with minimal work', hi: 'जरा सा काम करने पर भी बहुत ज्यादा थकान व कमजोरी', te: 'కొద్దిపాటి పనికే తీవ్రమైన నీరసం మరియు అలసట' },
        { id: 'gw_sym_2', en: 'Dizziness, blackout, or feeling faint when standing up', hi: 'खड़े होने पर चक्कर आना, अंधेरा छाना या बेहोशी जैसा लगना', te: 'నిలబడినప్పుడు కళ్లు తిరగడం లేదా స్పృహ తప్పినట్లు అనిపించడం', redFlagScore: 2 },
        { id: 'gw_sym_3', en: 'Pale skin, yellow eyes, breathlessness on walking (Anemia suspect)', hi: 'पीला चेहरा, खून की कमी और थोड़ा चलने पर सांस फूलना', te: 'రక్తహీనత / కొద్దిగా నడిచినా ఆయాసం' },
        { id: 'gw_sym_4', en: 'Trembling hands, excessive hunger, and sudden cold sweats (Sugar drop)', hi: 'हाथ कांपना, घबराहट और अचानक पसीना (शुगर लो होना)', te: 'చేతులు వణకడం మరియు విపరీతమైన చెమటలు (షుగర్ తగ్గడం)', redFlagScore: 3 }
      ]
    },
    {
      id: 'gw_chronic',
      key: 'Chronic Conditions & Daily Medicines',
      en: 'Do you have Diabetes, High BP, Thyroid disorder, or Low Hemoglobin (Anemia)?',
      hi: 'क्या आपको डायबिटीज, हाई बीपी, थायरॉइड या खून की कमी (एनीमिया) है?',
      te: 'మీకు డయాబెటిస్, హై బీపీ, థైరాయిడ్ లేదా రక్తహీనత ఉందా?',
      type: 'multi',
      options: [
        { id: 'gw_ch_1', en: 'Diabetes (Taking Metformin/Glimepiride or Insulin)', hi: 'डायबिटीज की बीमारी (दवा या इंसुलिन ले रहे हैं)', te: 'డయాబెటిస్ (మందులు లేదా ఇన్సులిన్ వాడుతున్నారు)' },
        { id: 'gw_ch_2', en: 'High Blood Pressure (Hypertension)', hi: 'हाई ब्लड प्रेशर की समस्या', te: 'హై బ్లడ్ ప్రెషర్' },
        { id: 'gw_ch_3', en: 'Thyroid disorder (Hypothyroidism / Tab. Thyronorm)', hi: 'थायरॉइड की बीमारी (Thyronorm गोली ले रहे हैं)', te: 'థైరాయిడ్ సమస్య' },
        { id: 'gw_ch_4', en: 'History of Low Hemoglobin / Blood transfusion', hi: 'खून की भारी कमी / पहले खून चढ़ाया गया था', te: 'తీవ్ర రక్తహీనత' }
      ]
    }
  ]
};

// Red flag detection logic based on conversation answers
export const evaluateClinicalRedFlags = (complaintId, answers = {}) => {
  const redFlags = [];
  let maxScore = 0;
  if (!answers || typeof answers !== 'object') {
    return { redFlags, maxScore };
  }

  // 1. Direct Option-Level Red Flag Evaluation (Checks ALL selected questions and options)
  const questions = clinicalQuestionsData[complaintId] || clinicalQuestionsData.chest_pain || [];
  questions.forEach((q) => {
    const selected = answers[q.id] || [];
    if (!selected || selected.length === 0) return;
    selected.forEach((ans) => {
      if (!ans) return;
      const matchedOpt = q.options?.find((opt) => 
        opt.id === ans ||
        opt.en === ans ||
        opt.hi === ans ||
        opt.te === ans ||
        (typeof ans === 'string' && (
          ans.toLowerCase().includes(opt.en.toLowerCase()) ||
          opt.en.toLowerCase().includes(ans.toLowerCase()) ||
          (opt.hi && (ans.includes(opt.hi) || opt.hi.includes(ans))) ||
          (opt.te && (ans.includes(opt.te) || opt.te.includes(ans)))
        ))
      );

      if (matchedOpt && matchedOpt.redFlagScore && matchedOpt.redFlagScore >= 2) {
        maxScore += matchedOpt.redFlagScore;
        const isCrit = matchedOpt.redFlagScore >= 4;
        const titleEn = `Clinical Red Flag: ${q.key} — ${matchedOpt.en}`;
        const titleHi = `⚠️ नैदानिक चेतावनी: ${q.key} — ${matchedOpt.hi || matchedOpt.en}`;
        const titleTe = `⚠️ క్లినికల్ ప్రమాద హెచ్చరిక: ${q.key} — ${matchedOpt.te || matchedOpt.en}`;
        if (!redFlags.some(r => r.titleEn === titleEn)) {
          redFlags.push({
            level: isCrit ? 'CRITICAL' : 'URGENT',
            titleEn,
            titleHi,
            titleTe,
            details: `${q.en} Answered: ${matchedOpt.en}`
          });
        }
      }
    });
  });

  // 2. CHEST PAIN RULES
  if (complaintId === 'chest_pain') {
    const hasBreathlessness = answers['cp_breathlessness']?.some(a => {
      const lower = String(a).toLowerCase();
      if (lower.includes('no breath') || lower.includes('नहीं') || lower.includes('లేదు')) return false;
      return a === 'cp_br_1' || lower.includes('severe') || lower.includes('difficulty at rest') || a.includes('सांस फूल') || a.includes('ఆయాసం');
    });

    const hasSweating = answers['cp_sweating']?.some(a => {
      const lower = String(a).toLowerCase();
      if (lower.includes('no sweat') || lower.includes('नहीं') || lower.includes('లేదు')) return false;
      return a === 'cp_sw_1' || lower.includes('cold sweat') || lower.includes('profuse') || a.includes('ठंडा पसीना') || a.includes('చల్లని చెమటలు');
    });

    const hasRadiation = answers['cp_radiation']?.some(a => {
      const lower = String(a).toLowerCase();
      if (lower.includes('no, does not') || lower.includes('नहीं, कहीं') || lower.includes('ఎక్కడికీ')) return false;
      return a === 'cp_rad_1' || a === 'cp_rad_2' || lower.includes('left arm') || lower.includes('jaw') || a.includes('बाएं हाथ') || a.includes('ఎడమ చేయి');
    });

    const isCrushing = answers['cp_character']?.some(a => {
      const lower = String(a).toLowerCase();
      return a === 'cp_char_1' || lower.includes('crushing') || lower.includes('squeezing') || a.includes('भारी दबाव') || a.includes('పిండేస్తున్నట్లు');
    });

    const isSevere = answers['cp_severity']?.some(a => {
      const lower = String(a).toLowerCase();
      if (lower.includes('1-3') || lower.includes('mild') || lower.includes('हल्की') || lower.includes('స్వల్ప')) return false;
      return a === 'cp_sev_3' || a === 'cp_sev_4' || lower.includes('7-8') || lower.includes('9-10') || lower.includes('unbearable') || a.includes('असहनीय') || a.includes('తీవ్రమైన');
    });

    const hasHeartHistory = answers['cp_past_heart']?.some(a => {
      const lower = String(a).toLowerCase();
      if (lower.includes('no previous') || lower.includes('नहीं') || lower.includes('లేదు')) return false;
      return a === 'cp_ph_1' || lower.includes('heart attack') || lower.includes('stent') || a.includes('हार्ट अटैक') || a.includes('హార్ట్ ఎటాక్');
    });

    if ((hasBreathlessness || hasSweating) && (isCrushing || isSevere || hasRadiation)) {
      redFlags.push({
        level: 'CRITICAL',
        titleEn: 'URGENT: Potential red-flag cardiac symptoms detected. Please alert hospital staff immediately.',
        titleHi: '⚠️ अति आवश्यक: दिल से जुड़े संभावित गंभीर लक्षण पाए गए हैं। कृपया तुरंत अस्पताल स्टाफ को सूचित करें।',
        titleTe: '⚠️ అత్యవసరం: గుండెకు సంబంధించిన సంభావ్య ప్రమాదకర లక్షణాలు గుర్తించబడ్డాయి. వెంటనే ఆసుపత్రి సిబ్బందిని సంప్రదించండి.',
        details: 'Combination of chest pressure with cold sweating, breathlessness, and/or pain radiation to left arm.'
      });
      maxScore += 5;
    } else if (hasBreathlessness || hasSweating) {
      redFlags.push({
        level: 'URGENT',
        titleEn: 'URGENT: Potential red-flag symptoms detected. Please alert hospital staff.',
        titleHi: '⚠️ आवश्यक: संभावित गंभीर लक्षण पाए गए हैं। कृपया अस्पताल स्टाफ को बताएं।',
        titleTe: '⚠️ ముఖ్య గమనిక: సంభావ్య ప్రమాదకర లక్షణాలు గుర్తించబడ్డాయి. దయచేసి సిబ్బందికి తెలియజేయండి.',
        details: 'Chest discomfort accompanied by shortness of breath or sweating.'
      });
      maxScore += 3;
    }

    if (hasHeartHistory && isSevere) {
      redFlags.push({
        level: 'URGENT',
        titleEn: 'High-risk cardiovascular history with acute severe chest pain.',
        titleHi: 'हृदय रोग के पुराने इतिहास के साथ तेज सीने का दर्द।',
        titleTe: 'గతంలో గుండెజబ్బు చరిత్రతో పాటు తీవ్రమైన ఛాతీ నొప్పి.',
        details: 'Patient has previous history of MI/Stent/Bypass.'
      });
      maxScore += 3;
    }
  }

  // 3. FEVER RULES
  if (complaintId === 'fever') {
    const hasWarningSigns = answers['fv_warning_signs']?.some(a => {
      const lower = String(a).toLowerCase();
      if (lower.includes('none') || lower.includes('नहीं') || lower.includes('లేవు')) return false;
      return a === 'fv_wn_1' || lower.includes('bleeding') || lower.includes('red skin spots') || lower.includes('break-bone') || a.includes('खून') || a.includes('రక్తం');
    });
    const hasSevereResp = answers['fv_respiratory']?.some(a => {
      const lower = String(a).toLowerCase();
      if (lower.includes('no cough') || lower.includes('नहीं') || lower.includes('లేవు')) return false;
      return a === 'fv_resp_1' || lower.includes('severe breathing') || a.includes('कठिनाई') || a.includes('తీవ్ర ఇబ్బంది');
    });

    if (hasWarningSigns) {
      redFlags.push({
        level: 'CRITICAL',
        titleEn: 'URGENT: Potential red-flag hemorrhagic fever / Dengue warning signs detected. Please alert hospital staff.',
        titleHi: '⚠️ अति आवश्यक: डेंगू/रक्तस्रावी बुखार के संभावित लक्षण पाए गए हैं। तुरंत डॉक्टर से संपर्क करें।',
        titleTe: '⚠️ అత్యవసరం: డెంగ్యూ / రక్తస్రావ జ్వర ప్రమాద హెచ్చరికలు గుర్తించబడ్డాయి. వెంటనే వైద్యులను సంప్రదించండి.',
        details: 'Bleeding signs, petechial rash, or severe persistent pain behind eyes.'
      });
      maxScore += 5;
    }

    if (hasSevereResp) {
      redFlags.push({
        level: 'URGENT',
        titleEn: 'URGENT: Fever with respiratory distress detected. Priority evaluation needed.',
        titleHi: '⚠️ आवश्यक: बुखार के साथ सांस लेने में कठिनाई। तुरंत जांच आवश्यक है।',
        titleTe: '⚠️ అత్యవసరం: జ్వరంతో పాటు తీవ్రమైన ఆయాసం.',
        details: 'High fever coupled with acute shortness of breath.'
      });
      maxScore += 4;
    }
  }

  // 4. HEADACHE RULES
  if (complaintId === 'headache') {
    const isThunderclap = answers['ha_onset']?.some(a => {
      const lower = String(a).toLowerCase();
      return a === 'ha_on_1' || lower.includes('thunderclap') || lower.includes('worst headache') || a.includes('सबसे तेज') || a.includes('పిడుగు');
    });
    const hasStrokeSigns = answers['ha_neuro']?.some(a => {
      const lower = String(a).toLowerCase();
      if (lower.includes('none') || lower.includes('नहीं') || lower.includes('లేవు')) return false;
      return a === 'ha_neu_1' || lower.includes('stroke') || lower.includes('weakness in arm') || lower.includes('slurred speech') || a.includes('कमजोरी') || a.includes('చచ్చుబడటం');
    });
    const hasMeningitisSigns = answers['ha_neuro']?.some(a => {
      const lower = String(a).toLowerCase();
      if (lower.includes('none') || lower.includes('नहीं') || lower.includes('లేవు')) return false;
      return a === 'ha_neu_2' || lower.includes('stiff neck') || lower.includes('light sensitivity') || a.includes('गर्दन अकड़') || a.includes('మెడ బిగుతు');
    });

    if (isThunderclap || hasStrokeSigns || hasMeningitisSigns) {
      redFlags.push({
        level: 'CRITICAL',
        titleEn: 'URGENT: Potential red-flag neurological symptoms detected. Please alert hospital staff immediately.',
        titleHi: '⚠️ अति आवश्यक: तंत्रिका तंत्र (Neurological) से जुड़े गंभीर लक्षण पाए गए हैं। तुरंत डॉक्टर को दिखाएं।',
        titleTe: '⚠️ అత్యవసరం: నరాల సంబంధిత అత్యవసర లక్షణాలు గుర్తించబడ్డాయి. వెంటనే సిబ్బందిని సంప్రదించండి.',
        details: 'Thunderclap onset, unilateral weakness, slurred speech, or fever with neck stiffness.'
      });
      maxScore += 5;
    }
  }

  // 5. ABDOMINAL PAIN RULES
  if (complaintId === 'abdominal_pain') {
    const isRightLower = answers['ab_location']?.some(a => a === 'ab_loc_1' || String(a).toLowerCase().includes('right lower'));
    const hasGiBleed = answers['ab_red_flags']?.some(a => {
      const lower = String(a).toLowerCase();
      if (lower.includes('none') || lower.includes('नहीं') || lower.includes('లేవు')) return false;
      return a === 'ab_rf_1' || lower.includes('vomiting blood') || lower.includes('black tarry') || a.includes('उल्टी में खून') || a.includes('రక్తం');
    });
    const hasObstruction = answers['ab_red_flags']?.some(a => {
      const lower = String(a).toLowerCase();
      if (lower.includes('none') || lower.includes('नहीं') || lower.includes('లేవు')) return false;
      return a === 'ab_rf_2' || lower.includes('unable to pass gas') || a.includes('गैस पास नहीं');
    });

    if (hasGiBleed || hasObstruction) {
      redFlags.push({
        level: 'CRITICAL',
        titleEn: 'URGENT: Potential acute surgical abdomen or GI bleeding detected. Please alert hospital staff.',
        titleHi: '⚠️ अति आवश्यक: पेट में आंतरिक रक्तस्राव या रुकावट के लक्षण। तुरंत आपातकालीन जांच कराएं।',
        titleTe: '⚠️ అత్యవసరం: జీర్ణకోశ రక్తస్రావం లేదా తీవ్రమైన కడుపు సమస్య గుర్తించబడింది.',
        details: 'Hematemesis, melena, or complete intestinal obstruction signs.'
      });
      maxScore += 5;
    } else if (isRightLower) {
      redFlags.push({
        level: 'URGENT',
        titleEn: 'URGENT: Acute right lower quadrant pain (Suspected Appendicitis risk). Priority evaluation needed.',
        titleHi: '⚠️ आवश्यक: पेट के निचले दाहिने हिस्से में तेज दर्द (अपेंडिक्स का संदेह)।',
        titleTe: '⚠️ ముఖ్య గమనిక: కడుపు కుడివైపు తీవ్ర నొప్పి (అపెండిసైటిస్ అనుమానం).',
        details: 'Focal right iliac fossa tenderness indicator.'
      });
      maxScore += 3;
    }
  }

  // 6. COUGH RULES
  if (complaintId === 'cough') {
    const hasHemoptysis = answers['cg_blood_tb']?.some(a => {
      const lower = String(a).toLowerCase();
      if (lower.includes('no blood') || lower.includes('नहीं') || lower.includes('లేవు')) return false;
      return a === 'cg_tb_1' || lower.includes('blood') || lower.includes('hemoptysis') || a.includes('खून') || a.includes('రక్తం');
    });
    const hasTbComplex = answers['cg_blood_tb']?.some(a => a === 'cg_tb_2' || String(a).toLowerCase().includes('tb suspect')) || answers['cg_duration']?.some(a => a === 'cg_dur_4' || String(a).includes('> 2 weeks'));

    if (hasHemoptysis) {
      redFlags.push({
        level: 'CRITICAL',
        titleEn: 'URGENT: Hemoptysis (Blood in sputum) detected. Please alert hospital staff immediately.',
        titleHi: '⚠️ अति आवश्यक: खांसी/बलगम में खून (Hemoptysis)। तुरंत डॉक्टर से परामर्श लें।',
        titleTe: '⚠️ అత్యవసరం: కఫంలో రక్తం పడటం గుర్తించబడింది. వెంటనే వైద్యులను సంప్రదించండి.',
        details: 'Active blood streaking in sputum cough.'
      });
      maxScore += 5;
    } else if (hasTbComplex) {
      redFlags.push({
        level: 'URGENT',
        titleEn: 'National TB Elimination Programme (NTEP) Protocol: Chronic cough > 2 weeks. Priority sputum/X-ray evaluation.',
        titleHi: '⚠️ स्वास्थ्य प्रोटोकॉल: 2 सप्ताह से अधिक की पुरानी खांसी। बलगम और छाती की जांच आवश्यक है।',
        titleTe: '⚠️ ఆరోగ్య ప్రోటోకాల్: 2 వారాలకు పైగా దగ్గు. క్షయ పరీక్షల కొరకు ప్రాధాన్యత.',
        details: 'Presumptive pulmonary tuberculosis screening criteria met.'
      });
      maxScore += 3;
    }
  }

  // 7. BACK PAIN RULES
  if (complaintId === 'back_pain') {
    const hasCaudaEquina = answers['bk_red_flags']?.some(a => {
      const lower = String(a).toLowerCase();
      if (lower.includes('none') || lower.includes('नहीं') || lower.includes('లేవు')) return false;
      return a === 'bk_rf_1' || lower.includes('loss of urine') || lower.includes('cauda equina') || a.includes('पेशाब/मल नियंत्रण') || a.includes('నియంత్రణ కోల్పోవడం');
    });
    const hasFootDrop = answers['bk_red_flags']?.some(a => {
      const lower = String(a).toLowerCase();
      if (lower.includes('none') || lower.includes('नहीं') || lower.includes('లేవు')) return false;
      return a === 'bk_rf_2' || lower.includes('foot drop') || a.includes('लकवा') || a.includes('కాలు ఎత్తలేకపోవడం');
    });

    if (hasCaudaEquina) {
      redFlags.push({
        level: 'CRITICAL',
        titleEn: 'EMERGENCY: Suspected Cauda Equina Syndrome (Loss of bowel/bladder control). Immediate neurosurgical referral needed.',
        titleHi: '⚠️ अत्यंत गंभीर: काउडा इक्विना सिंड्रोम का संदेह (पेशाब/मल नियंत्रण खोना)। तुरंत आपातकालीन सर्जरी जांच आवश्यक है।',
        titleTe: '⚠️ అత్యవసరం: నాడీ ఒత్తిడి హెచ్చరిక (మూత్రం/మలం నియంత్రణ కోల్పోవడం). వెంటనే న్యూరో సర్జన్‌ను సంప్రదించండి.',
        details: 'Bladder/bowel dysfunction associated with severe acute spinal compression.'
      });
      maxScore += 5;
    } else if (hasFootDrop) {
      redFlags.push({
        level: 'URGENT',
        titleEn: 'URGENT: Acute motor deficit (Foot drop) detected. Urgent spinal evaluation needed.',
        titleHi: '⚠️ आवश्यक: पैर में लकवा/कमजोरी (Foot drop)। रीढ़ की हड्डी की तुरंत जांच कराएं।',
        titleTe: '⚠️ ముఖ్య గమనిక: కాలు ఎత్తలేకపోవడం / తిమ్మిరి. తక్షణ వెన్నెముక పరీక్ష అవసరం.',
        details: 'L4/L5 nerve root motor compromise.'
      });
      maxScore += 3;
    }
  }

  // 8. SKIN RASH RULES
  if (complaintId === 'skin_rash') {
    const hasAnaphylaxis = answers['sk_red_flags']?.some(a => {
      const lower = String(a).toLowerCase();
      if (lower.includes('none') || lower.includes('नहीं') || lower.includes('లేవు')) return false;
      return a === 'sk_rf_1' || lower.includes('anaphylaxis') || lower.includes('throat tightness') || a.includes('गले में सूजन') || a.includes('శ్వాసనాళాల వాపు');
    });
    if (hasAnaphylaxis) {
      redFlags.push({
        level: 'CRITICAL',
        titleEn: 'EMERGENCY: Acute Anaphylaxis / Severe Allergic Airway compromise detected. Immediate resuscitation needed.',
        titleHi: '⚠️ अत्यंत गंभीर: एनाफिलेक्सिस (तीव्र जानलेवा एलर्जी)। तुरंत आपातकालीन इंजेक्शन व उपचार आवश्यक है।',
        titleTe: '⚠️ ప్రాణాంతక అలర్జీ: ముఖం/శ్వాసనాళాల తీవ్ర వాపు. తక్షణ చికిత్స అవసరం.',
        details: 'Rapid onset cutaneous signs with respiratory/airway involvement.'
      });
      maxScore += 5;
    }
  }

  // 9. URINARY RULES
  if (complaintId === 'urinary_trouble') {
    const hasGrossHematuria = answers['ur_symptoms']?.some(a => {
      const lower = String(a).toLowerCase();
      if (lower.includes('none') || lower.includes('नहीं') || lower.includes('లేవు')) return false;
      return a === 'ur_sym_1' || lower.includes('blood in urine') || a.includes('खून आना') || a.includes('రక్తం');
    });
    const hasRetention = answers['ur_symptoms']?.some(a => {
      const lower = String(a).toLowerCase();
      if (lower.includes('none') || lower.includes('नहीं') || lower.includes('లేవు')) return false;
      return a === 'ur_sym_2' || lower.includes('unable to pass urine') || a.includes('पेशाब का रुकाव') || a.includes('మూత్రం నిలిచిపోవడం');
    });
    const hasUrosepsis = answers['ur_stone_fever']?.some(a => {
      const lower = String(a).toLowerCase();
      if (lower.includes('none') || lower.includes('नहीं') || lower.includes('లేవు')) return false;
      return a === 'ur_sf_1' || lower.includes('high fever with shivering') || a.includes('तेज बुखार') || a.includes('చలితో జ్వరం');
    });

    if (hasUrosepsis || hasRetention) {
      redFlags.push({
        level: 'CRITICAL',
        titleEn: 'URGENT: Acute urinary retention or suspected Urosepsis/Pyelonephritis. Priority catheterization/evaluation needed.',
        titleHi: '⚠️ अति आवश्यक: पेशाब का पूर्ण रुकाव या गंभीर किडनी संक्रमण। तुरंत आपातकालीन जांच कराएं।',
        titleTe: '⚠️ అత్యవసరం: మూత్రం నిలిచిపోవడం లేదా తీవ్ర కిడ్నీ ఇన్ఫెక్షన్.',
        details: 'Complete urinary retention or ascending pyelonephritis criteria.'
      });
      maxScore += 5;
    } else if (hasGrossHematuria) {
      redFlags.push({
        level: 'URGENT',
        titleEn: 'URGENT: Gross Hematuria (Active blood in urine). Priority urology evaluation needed.',
        titleHi: '⚠️ आवश्यक: पेशाब में खून (Hematuria)। यूरोलॉजी जांच आवश्यक है।',
        titleTe: '⚠️ ముఖ్య గమనిక: మూత్రంలో రక్తం. యూరాలజీ పరీక్షలు అవసరం.',
        details: 'Active visible urinary bleeding indicator.'
      });
      maxScore += 3;
    }
  }

  return { redFlags, maxScore };
};
