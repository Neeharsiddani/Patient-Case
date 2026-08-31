/**
 * MediMitra AYUSH / Ayurveda Clinical History & Dashavidha Pariksha Framework
 * 
 * Provides structured clinical ontologies, patient-friendly plain-language questionnaires,
 * and bilingual prompts (English, Hindi, Telugu) for:
 * 1. Dashavidha Pariksha (10-fold clinical assessment)
 * 2. Agni & Koshtha (Digestive fire & bowel movement physiology)
 * 3. Ahara & Vihara (Dietary habits, daily regimen, and lifestyle)
 * 4. Nidana & Samprapti (Patient-reported causative triggers & disease progression)
 * 
 * Safety Directive:
 * Distinguishes PATIENT-REPORTED AYUSH responses from CLINICIAN-VERIFIED clinical conclusions.
 */

export const DASHAVIDHA_PARIKSHA_FIELDS = [
  {
    id: 'prakriti',
    titleEn: '1. Body Constitution (Prakriti)',
    titleHi: '1. शारीरिक प्रकृति (Prakriti)',
    titleTe: '1. శరీర ప్రకృతి (Prakriti)',
    descEn: 'Your natural physical build, skin tendencies, thermal preferences, and sleep habits since early life.',
    descHi: 'आपका स्वाभाविक शारीरिक ढांचा, त्वचा की बनावट, गर्मी-सर्दी सहनशीलता और नींद का तरीका।',
    descTe: 'మీ సహజ శారీరక నిర్మాణం, చర్మ స్వభావం, ఉష్ణోగ్రత ప్రాధాన్యతలు మరియు నిద్ర అలవాట్లు.',
    icon: 'User',
    audioPrompt: 'Please tell us about your natural physical frame, skin type, and whether you feel more sensitive to heat or cold.',
    questions: [
      {
        key: 'bodyFrame',
        labelEn: 'Physical Body Frame & Build',
        labelHi: 'शारीरिक ढांचा एवं बनावट',
        labelTe: 'శరీర నిర్మాణం మరియు తీరు',
        options: [
          { value: 'Lean / Slender (Vata tendency)', labelEn: 'Lean, light or slender build with visible joints', labelHi: 'दुबला-पतला, हल्का शरीर, जोड़ स्पष्ट दिखते हैं' },
          { value: 'Medium / Athletic (Pitta tendency)', labelEn: 'Medium, well-proportioned athletic build', labelHi: 'मध्यम, सुडौल एवं संतुलित शरीर' },
          { value: 'Broad / Heavy (Kapha tendency)', labelEn: 'Broad, heavy, strong and well-built frame', labelHi: 'चौड़ा, भारी, मजबूत एवं गठीला शरीर' }
        ]
      },
      {
        key: 'skinNature',
        labelEn: 'Skin Texture & Sensation',
        labelHi: 'त्वचा की बनावट व प्रकृति',
        labelTe: 'చర్మ స్వభావం',
        options: [
          { value: 'Dry / Rough / Cool', labelEn: 'Dry, rough, easily chapped, tends to feel cool', labelHi: 'रूखी, खुरदरी, जल्दी फटने वाली, ठंडी' },
          { value: 'Warm / Oily / Sensitive', labelEn: 'Warm, soft, reddish, oily T-zone, prone to moles/rashes', labelHi: 'गर्म, तैलीय, संवेदनशील, तिल या दानों की प्रवृत्ति' },
          { value: 'Thick / Soft / Moist', labelEn: 'Thick, smooth, well-hydrated, fair or glowing', labelHi: 'मोटी, चिकनी, मुलायम एवं चमकदार' }
        ]
      },
      {
        key: 'thermalPreference',
        labelEn: 'Tolerance to Climate & Temperature',
        labelHi: 'मौसम एवं तापमान सहनशीलता',
        labelTe: 'వాతావరణ సహనశీలత',
        options: [
          { value: 'Sensitive to Cold (Prefers Warmth)', labelEn: 'Cannot tolerate cold weather/AC, prefers warm sunlight', labelHi: 'ठंड बिल्कुल सहन नहीं होती, गर्म मौसम पसंद है' },
          { value: 'Sensitive to Heat (Prefers Cool)', labelEn: 'Cannot tolerate hot sun/stuffy rooms, prefers cool air', labelHi: 'गर्मी बिल्कुल सहन नहीं होती, ठंडी जगह पसंद है' },
          { value: 'Tolerates Both Moderately', labelEn: 'Comfortable in most climates, adapts well', labelHi: 'गर्मी और सर्दी दोनों आराम से सहन हो जाती हैं' }
        ]
      },
      {
        key: 'sleepPattern',
        labelEn: 'Sleep Depth & Routine',
        labelHi: 'नींद का प्रकार एवं गहराई',
        labelTe: 'నిద్ర అలవాట్లు',
        options: [
          { value: 'Light / Easily Disturbed', labelEn: 'Light sleeper, wakes easily, active dreams', labelHi: 'हल्की नींद, जल्दी आंख खुलना, बहुत सपने आना' },
          { value: 'Moderate / Vivid Dreams', labelEn: 'Moderate sleep (6-7 hrs), waking up refreshed', labelHi: 'मध्यम नींद (6-7 घंटे), जागने पर ताजगी' },
          { value: 'Deep / Heavy Sleep', labelEn: 'Deep, sound, long sleep, difficult to wake early', labelHi: 'गहरी, भारी नींद, सुबह उठने में भारीपन' }
        ]
      }
    ]
  },
  {
    id: 'vikriti',
    titleEn: '2. Current Imbalance & Illness (Vikriti)',
    titleHi: '2. वर्तमान रोग स्थिति (Vikriti)',
    titleTe: '2. ప్రస్తుత రోగ స్థితి (Vikriti)',
    descEn: 'The specific symptom patterns, discomforts, and physical changes you are experiencing right now.',
    descHi: 'वर्तमान में आपके शरीर में हो रही असुविधाएं, रोग लक्षण और दोष असंतुलन।',
    descTe: 'ప్రస్తుతం మీరు ఎదుర్కొంటున్న సమస్యలు మరియు శారీరక మార్పులు.',
    icon: 'Activity',
    audioPrompt: 'Please select what acute symptoms or bodily discomforts you are currently experiencing.',
    questions: [
      {
        key: 'primaryImbalanceSymptoms',
        labelEn: 'Dominant Symptom Cluster (Select all that apply)',
        labelHi: 'मुख्य लक्षण समूह (जो लागू हों चुनें)',
        labelTe: 'ప్రధాన లక్షణాలు',
        isMulti: true,
        options: [
          { value: 'Joint stiffness, body ache, gas, dryness (Vata)', labelEn: 'Joint pains, body stiffness, dry skin, constipation, gas/bloating', labelHi: 'जोड़ों में दर्द, जकड़न, गैस, पेट फूलना, रूखापन' },
          { value: 'Hyperacidity, burning sensation, excess heat, skin breakouts (Pitta)', labelEn: 'Heartburn, sour belching, hot flushes, skin rashes, burning eyes', labelHi: 'सीने में जलन, खट्टी डकारें, अत्यधिक गर्मी, त्वचा पर दाने' },
          { value: 'Heavy body, lethargy, congestion, cough, slow digestion (Kapha)', labelEn: 'Heaviness in chest/head, productive cough, lethargy, poor appetite', labelHi: 'शरीर में भारीपन, सुस्ती, बलगम, भारी पाचन' }
        ]
      },
      {
        key: 'durationOfImbalance',
        labelEn: 'How long have these symptoms persisted?',
        labelHi: 'यह समस्या कितने समय से है?',
        labelTe: 'ఈ సమస్య ఎంత కాలంగా ఉంది?',
        options: [
          { value: 'Acute (< 2 weeks)', labelEn: 'Recent onset (Under 2 weeks)', labelHi: 'हाल ही में (2 सप्ताह से कम)' },
          { value: 'Sub-acute (2 weeks to 3 months)', labelEn: 'Ongoing (2 weeks to 3 months)', labelHi: 'मध्यम अवधि (2 सप्ताह से 3 महीने)' },
          { value: 'Chronic (> 3 months)', labelEn: 'Long-standing chronic illness (> 3 months)', labelHi: 'लंबे समय से (> 3 महीने)' }
        ]
      }
    ]
  },
  {
    id: 'sara',
    titleEn: '3. Tissue Quality & Vitality (Sara)',
    titleHi: '3. धातु सारता एवं तेज (Sara)',
    titleTe: '3. ధాతు సారత (Sara)',
    descEn: 'The strength, tone, and vitality of your skin, muscles, bones, and body tissues.',
    descHi: 'आपकी त्वचा, मांसपेशियों, हड्डियों और शारीरिक धातुओं का पोषण एवं मजबूती।',
    descTe: 'మీ చర్మం, కండరాలు మరియు ఎముకల బలం.',
    icon: 'Sparkles',
    questions: [
      {
        key: 'overallVitality',
        labelEn: 'Overall Bodily Vitality & Energy',
        labelHi: 'शारीरिक ओज एवं ऊर्जा स्तर',
        labelTe: 'శరీర శక్తి స్థాయి',
        options: [
          { value: 'High / Excellent Stamina (Pravara Sara)', labelEn: 'High vitality, radiant complexion, firm body, excellent endurance', labelHi: 'उत्तम ऊर्जा, चमकदार त्वचा, गठीला शरीर, मजबूत सहनशक्ति' },
          { value: 'Moderate / Average (Madhya Sara)', labelEn: 'Average energy, sustains normal daily activities well', labelHi: 'मध्यम ऊर्जा, सामान्य दैनिक कार्यों में संतुलित' },
          { value: 'Low / Easily Fatigued (Avara Sara)', labelEn: 'Low stamina, fatigues easily with mild activity, weak muscle tone', labelHi: 'कम ऊर्जा, थोड़े काम में थकान, कमजोर मांसपेशियां' }
        ]
      }
    ]
  },
  {
    id: 'samhanana',
    titleEn: '4. Body Compactness (Samhanana)',
    titleHi: '4. शारीरिक संहनन / सुदृढ़ता (Samhanana)',
    titleTe: '4. శరీర దృఢత్వం (Samhanana)',
    descEn: 'The compactness, symmetry, and joint firmness of your body frame.',
    descHi: 'हड्डियों और जोड़ों की मजबूती तथा शरीर का सुगठित होना।',
    descTe: 'కీళ్ల బలం మరియు శరీర అమరిక.',
    icon: 'Layers',
    questions: [
      {
        key: 'bodyCompactness',
        labelEn: 'Body Firmness & Joint Alignment',
        labelHi: 'शरीर की सुदृढ़ता व जोड़ों का गठन',
        labelTe: 'శరీర దృఢత్వం',
        options: [
          { value: 'Su-samhata (Well-compacted & firm)', labelEn: 'Firm, robust, well-knit joints with excellent posture', labelHi: 'सुगठित, मजबूत जोड़ और उत्कृष्ट शारीरिक स्थिरता' },
          { value: 'Madhyama (Moderate compactness)', labelEn: 'Average joint compactness and firmness', labelHi: 'मध्यम सुदृढ़ता एवं सामान्य जोड़' },
          { value: 'Hina / Avara (Loose or frail)', labelEn: 'Frail frame, loose joints, easily strained muscles', labelHi: 'कमजोर जोड़, ढीली मांसपेशियां, जल्दी खिंचाव' }
        ]
      }
    ]
  },
  {
    id: 'pramana',
    titleEn: '5. Anthropometry & Proportions (Pramana)',
    titleHi: '5. शारीरिक प्रमाण / अनुपात (Pramana)',
    titleTe: '5. శరీర ప్రమాణం (Pramana)',
    descEn: 'Assessment of height-to-weight proportion, limb symmetry, and body circumference.',
    descHi: 'कद, वजन और शारीरिक अंगों का परस्पर संतुलित अनुपात।',
    descTe: 'ఎత్తు మరియు బరువు నిష్పత్తి.',
    icon: 'Sliders',
    questions: [
      {
        key: 'bodyProportion',
        labelEn: 'Height-Weight Proportional Symmetry',
        labelHi: 'कद एवं वजन का संतुलन',
        labelTe: 'శరీర నిష్పత్తి',
        options: [
          { value: 'Sama Pramana (Well-proportioned)', labelEn: 'Normal BMI and proportionate limb-to-torso ratio', labelHi: 'संतुलित कद-काठी एवं सामान्य बीएमआई' },
          { value: 'Heena Pramana (Underweight / Short-limbed)', labelEn: 'Significantly underweight or frail limb circumference', labelHi: 'कम वजन या दुबला-पतला' },
          { value: 'Adhika Pramana (Overweight / Heavy circumference)', labelEn: 'Overweight or increased waist-hip circumference', labelHi: 'अधिक वजन या भारी पेट/कमर' }
        ]
      }
    ]
  },
  {
    id: 'satmya',
    titleEn: '6. Habitual Suitability (Satmya)',
    titleHi: '6. सात्म्यता / अनुकूलन (Satmya)',
    titleTe: '6. సాత్మ్యత (Satmya)',
    descEn: 'Foods, tastes, routines, and seasons that naturally suit your body and promote well-being.',
    descHi: 'वे आहार और आदतें जो आपके शरीर को स्वाभाविक रूप से सूट करती हैं।',
    descTe: 'మీ శరీరానికి నప్పే ఆహారాలు మరియు అలవాట్లు.',
    icon: 'Shield',
    questions: [
      {
        key: 'dietSuitability',
        labelEn: 'Foods & Tastes Most Comfortable For You',
        labelHi: 'आपके शरीर के लिए सबसे अनुकूल आहार',
        labelTe: 'అనుకూలమైన ఆహారం',
        options: [
          { value: 'Sarva Rasa (Adapts to all food types)', labelEn: 'Can digest all tastes (sweet, sour, salty, pungent, bitter, astringent) with ease', labelHi: 'सभी प्रकार के स्वाद व भोजन आसानी से पचते हैं (सर्व रस सात्म्य)' },
          { value: 'Madhyama (Prefers warm, cooked simple foods)', labelEn: 'Best with warm, simple, freshly cooked homemade meals', labelHi: 'ताजा, हल्का, घर का बना सात्विक भोजन ही अनुकूल है' },
          { value: 'Avara / Selective (Sensitive to many foods)', labelEn: 'Sensitive digestion; easily disturbed by outside, sour, or spicy food', labelHi: 'अधिक संवेदनशील, बाहर के या भारी भोजन से तुरंत परेशानी' }
        ]
      }
    ]
  },
  {
    id: 'sattva',
    titleEn: '7. Mental Resilience (Sattva)',
    titleHi: '7. मानसिक मनोबल / सत्व (Sattva)',
    titleTe: '7. మానసిక మనోబలం (Sattva)',
    descEn: 'Your psychological tone, emotional composure, memory, and coping capacity during stress.',
    descHi: 'तनाव, चिंता और बीमारी के समय आपकी मानसिक शक्ति एवं धैर्य।',
    descTe: 'ఒత్తిడిని తట్టుకునే మానసిక శక్తి.',
    icon: 'Brain',
    questions: [
      {
        key: 'mentalResilience',
        labelEn: 'Mental Response to Stress & Illness',
        labelHi: 'तनाव या बीमारी में मानसिक प्रतिक्रिया',
        labelTe: 'మానసిక ప్రతిస్పందన',
        options: [
          { value: 'Pravara Sattva (Strong mental resolve & calm)', labelEn: 'High emotional composure, tolerates pain patiently, remains calm under stress', labelHi: 'मजबूत मनोबल, धैर्यवान, दर्द व तनाव में भी शांत (प्रवर सत्व)' },
          { value: 'Madhya Sattva (Moderate resolve with support)', labelEn: 'Moderate resilience; manages stress with family support and reassurance', labelHi: 'मध्यम मनोबल, समझाए जाने पर धैर्य रखने वाला (मध्यम सत्व)' },
          { value: 'Avara Sattva (Easily anxious or overwhelmed)', labelEn: 'Becomes fearful, anxious, low pain tolerance, easily overwhelmed', labelHi: 'जल्दी घबराने वाला, अधिक चिंता और कम दर्द सहनशीलता (अवर सत्व)' }
        ]
      }
    ]
  },
  {
    id: 'aharaShakti',
    titleEn: '8. Food & Digestive Power (Ahara Shakti)',
    titleHi: '8. आहार शक्ति / भूख व पाचन (Ahara Shakti)',
    titleTe: '8. ఆహార శక్తి (Ahara Shakti)',
    descEn: 'Your food intake capacity (Abhyavaharana) and digestive processing speed (Jarana Shakti).',
    descHi: 'आपकी भोजन ग्रहण करने की क्षमता (भूख) और उसे पचाने की शक्ति।',
    descTe: 'ఆకలి మరియు జీర్ణశక్తి.',
    icon: 'Flame',
    questions: [
      {
        key: 'appetiteDigestionPower',
        labelEn: 'Appetite & Post-Meal Digestion',
        labelHi: 'भूख का स्तर एवं पाचन की गति',
        labelTe: 'జీర్ణశక్తి సామర్థ్యం',
        options: [
          { value: 'Pravara (Strong appetite, digests heavy food easily in 3-4 hrs)', labelEn: 'Excellent appetite, digests regular meals in 3-4 hours without heaviness', labelHi: 'अच्छी भूख, 3-4 घंटे में भोजन सुगमता से पचना (प्रवर आहार शक्ति)' },
          { value: 'Madhya (Moderate appetite, normal digestion)', labelEn: 'Moderate appetite, digests normal portions comfortably', labelHi: 'मध्यम भूख, सामान्य मात्रा में भोजन ठीक पचना (मध्यम शक्ति)' },
          { value: 'Avara (Weak appetite, slow digestion, bloating for hours)', labelEn: 'Poor appetite, feels heavy or bloated for many hours after meals', labelHi: 'कम भूख, भोजन के बाद घंटों तक भारीपन या डकारें (अवर शक्ति)' }
        ]
      }
    ]
  },
  {
    id: 'vyayamaShakti',
    titleEn: '9. Physical Endurance (Vyayama Shakti)',
    titleHi: '9. व्यायाम शक्ति / कार्य क्षमता (Vyayama Shakti)',
    titleTe: '9. శారీరక వ్యాయామ శక్తి (Vyayama Shakti)',
    descEn: 'Your capacity to perform physical work, walking, and daily exercise without undue breathlessness.',
    descHi: 'शारीरिक परिश्रम, चलने और व्यायाम को बिना अत्यधिक थकान के करने की क्षमता।',
    descTe: 'శారీరక శ్రమ మరియు వ్యాయామ సామర్థ్యం.',
    icon: 'Activity',
    questions: [
      {
        key: 'physicalEndurance',
        labelEn: 'Work & Exercise Tolerance',
        labelHi: 'शारीरिक परिश्रम सहनशीलता',
        labelTe: 'శ్రమ సామర్థ్యం',
        options: [
          { value: 'Pravara (Can walk > 4 km or do intense physical work without fatigue)', labelEn: 'High physical stamina, can exercise or work for hours without fatigue', labelHi: 'उत्तम सहनशक्ति, लंबा पैदल चलना या भारी कार्य बिना थके करना' },
          { value: 'Madhya (Can walk 1-3 km comfortably)', labelEn: 'Can perform routine household and office work comfortably', labelHi: 'मध्यम सहनशक्ति, सामान्य दैनिक कार्य आसानी से करना' },
          { value: 'Avara (Gets breathless or exhausted with minimal effort)', labelEn: 'Becomes tired or breathless on climbing 1 flight of stairs or mild walking', labelHi: 'कम सहनशक्ति, सीढ़ियां चढ़ने या थोड़े चलने पर सांस फूलना/थकान' }
        ]
      }
    ]
  },
  {
    id: 'vaya',
    titleEn: '10. Biological Age Stage (Vaya)',
    titleHi: '10. वय / आयु अवस्था (Vaya)',
    titleTe: '10. వయస్సు దశ (Vaya)',
    descEn: 'Biological age classification and predominant physiological Dosha stage.',
    descHi: 'आयु की अवस्था एवं उस अवस्था का प्रधान शारीरिक दोष।',
    descTe: 'వయో దశ.',
    icon: 'Clock',
    questions: [
      {
        key: 'ageStage',
        labelEn: 'Biological Life Stage',
        labelHi: 'आयु वर्ग एवं जीवन काल',
        labelTe: 'వయోవర్గం',
        options: [
          { value: 'Balya (0-16 yrs - Growth / Kapha stage)', labelEn: 'Childhood / Growth Phase (Balya Awastha)', labelHi: 'बाल्यावस्था (0-16 वर्ष - कफ प्रधान विकास काल)' },
          { value: 'Madhyama (16-60 yrs - Youth & Adulthood / Pitta stage)', labelEn: 'Youth & Productive Adulthood (Madhyama Awastha)', labelHi: 'युवावस्था एवं प्रौढ़ावस्था (16-60 वर्ष - पित्त प्रधान काल)' },
          { value: 'Vardhakya (>60 yrs - Senior & Elder / Vata stage)', labelEn: 'Senior & Elder Phase (Vardhakya Awastha)', labelHi: 'वृद्धावस्था (>60 वर्ष - वात प्रधान काल)' }
        ]
      }
    ]
  }
];

export const ADDITIONAL_AYUSH_SECTIONS = [
  {
    id: 'agni',
    titleEn: 'Digestive Fire (Agni)',
    titleHi: 'जठराग्नि (Agni)',
    descEn: 'The state and consistency of your metabolic fire and hunger.',
    icon: 'Flame',
    options: [
      { value: 'Samagni (Balanced & regular)', labelEn: 'Regular, healthy hunger at fixed hours; food digests smoothly (Balanced)', labelHi: 'नियत समय पर भूख, भोजन का सुचारू पाचन (समाग्नि)' },
      { value: 'Vishamagni (Irregular & fluctuating - Vata)', labelEn: 'Unpredictable hunger; sometimes ravenous, sometimes zero appetite, gas (Vata)', labelHi: 'अनियमित भूख, कभी बहुत तेज तो कभी बिल्कुल नहीं, गैस (विषमाग्नि)' },
      { value: 'Tikshnagni (Intense & hyperacidic - Pitta)', labelEn: 'Intense hunger, gets irritable if food is delayed, acidity/burning (Pitta)', labelHi: 'अत्यधिक तेज भूख, समय पर खाना न मिलने पर सिरदर्द या जलन (तीक्ष्णाग्नि)' },
      { value: 'Mandagni (Sluggish & heavy - Kapha)', labelEn: 'Poor appetite, eats out of habit, sluggish digestion for hours (Kapha)', labelHi: 'कम भूख, भोजन देर से पचना, भारीपन (मंदाग्नि)' }
    ]
  },
  {
    id: 'koshtha',
    titleEn: 'Bowel Tendency (Koshtha)',
    titleHi: 'कोष्ठ एवं मल प्रवृत्ति (Koshtha)',
    descEn: 'Natural bowel movement pattern and sensitivity of your digestive tract.',
    icon: 'Layers',
    options: [
      { value: 'Mridu Koshtha (Soft / sensitive bowels)', labelEn: 'Soft stools 1-2 times daily; loose bowels easily triggered by warm milk or fruits (Pitta)', labelHi: 'मृदु कोष्ठ - दिन में 1-2 बार सुगमता से, गर्म दूध या फल से भी पेट साफ' },
      { value: 'Madhyama Koshtha (Normal regular bowels)', labelEn: 'Formed stools once daily in morning without strain (Balanced)', labelHi: 'मध्यम कोष्ठ - प्रतिदिन सुबह नियमित रूप से सामान्य पेट साफ' },
      { value: 'Krura Koshtha (Hard / constipated bowels)', labelEn: 'Hard, dry stools, requires strain or laxatives, irregular frequency (Vata)', labelHi: 'क्रूर कोष्ठ - सूखा, कड़ा मल, कब्ज की प्रवृत्ति, जोर लगाना पड़ना' }
    ]
  },
  {
    id: 'ahara',
    titleEn: 'Dietary Routine & Tastes (Ahara)',
    titleHi: 'आहार शैली व रुचि (Ahara)',
    descEn: 'Your everyday food intake, taste preferences, water consumption, and meal timings.',
    icon: 'Utensils'
  },
  {
    id: 'vihara',
    titleEn: 'Daily Regimen & Lifestyle (Vihara)',
    titleHi: 'दिनचर्या व विहार (Vihara)',
    descEn: 'Wake-up time, sleep schedule, daytime naps, physical movement, and mental stressors.',
    icon: 'Clock'
  },
  {
    id: 'nidana',
    titleEn: 'Causative Triggers (Nidana)',
    titleHi: 'रोग का कारण / निदान (Nidana)',
    descEn: 'What patient-reported factors (food, weather, stress, late nights) seem to trigger or worsen your illness.',
    icon: 'AlertCircle'
  },
  {
    id: 'samprapti',
    titleEn: 'Disease Progression (Samprapti)',
    titleHi: 'रोग का विकास / सम्प्राप्ति (Samprapti)',
    descEn: 'How this problem initially started, what stages it passed through, and what relieves or worsens it.',
    icon: 'Activity'
  }
];

export const createInitialAyushState = () => ({
  dashavidhaPariksha: {
    prakriti: {
      bodyFrame: 'Medium / Athletic (Pitta tendency)',
      skinNature: 'Warm / Oily / Sensitive',
      thermalPreference: 'Sensitive to Heat (Prefers Cool)',
      sleepPattern: 'Moderate / Vivid Dreams',
      clinicianVerified: {
        dominantDosha: '',
        assessmentNotes: '',
        isVerified: false
      }
    },
    vikriti: {
      primaryImbalanceSymptoms: [],
      durationOfImbalance: 'Acute (< 2 weeks)',
      customSymptoms: '',
      clinicianVerified: {
        aggravatedDosha: '',
        dushyaInvolved: '',
        isVerified: false
      }
    },
    sara: {
      overallVitality: 'Moderate / Average (Madhya Sara)',
      clinicianVerified: {
        predominantDhatuSara: '',
        grade: '',
        isVerified: false
      }
    },
    samhanana: {
      bodyCompactness: 'Madhyama (Moderate compactness)',
      clinicianVerified: {
        status: '',
        isVerified: false
      }
    },
    pramana: {
      bodyProportion: 'Sama Pramana (Well-proportioned)',
      clinicianVerified: {
        status: '',
        isVerified: false
      }
    },
    satmya: {
      dietSuitability: 'Madhyama (Prefers warm, cooked simple foods)',
      clinicianVerified: {
        category: '',
        isVerified: false
      }
    },
    sattva: {
      mentalResilience: 'Madhya Sattva (Moderate resolve with support)',
      clinicianVerified: {
        level: '',
        isVerified: false
      }
    },
    aharaShakti: {
      appetiteDigestionPower: 'Madhya (Moderate appetite, normal digestion)',
      clinicianVerified: {
        grade: '',
        isVerified: false
      }
    },
    vyayamaShakti: {
      physicalEndurance: 'Madhya (Can walk 1-3 km comfortably)',
      clinicianVerified: {
        grade: '',
        isVerified: false
      }
    },
    vaya: {
      ageStage: 'Madhyama (16-60 yrs - Youth & Adulthood / Pitta stage)',
      clinicianVerified: {
        doshaDominanceByAge: '',
        isVerified: false
      }
    }
  },
  additionalHistory: {
    agni: 'Samagni (Balanced & regular)',
    koshtha: 'Madhyama Koshtha (Normal regular bowels)',
    ahara: {
      dietType: 'Vegetarian with dairy',
      tastePreferences: ['Sweet', 'Spicy'],
      mealTimings: 'Regular meal times',
      waterIntake: '2 - 3 Litres / day',
      unwholesomeHabits: 'Occasional late dinner'
    },
    vihara: {
      wakeTime: '6:30 AM',
      sleepTime: '11:00 PM',
      daytimeNap: 'None',
      exerciseHabit: 'Walking 20 mins',
      stressLevel: 'Moderate'
    },
    nidana: {
      patientReportedTriggers: 'Irregular meal timings and stress during work',
      onsetCircumstances: 'Started after traveling and eating unaccustomed spicy food'
    },
    samprapti: {
      patientReportedProgression: 'Started with mild sour belching, then burning sensation in stomach',
      relievingFactors: 'Cold water, buttermilk, resting',
      aggravatingFactors: 'Spicy food, empty stomach, anxiety'
    }
  },
  metadata: {
    isAyushCase: true,
    intakeRecordedAt: new Date().toISOString(),
    verificationStatus: 'Patient-Reported Draft (Pending Clinician Review)'
  }
});
