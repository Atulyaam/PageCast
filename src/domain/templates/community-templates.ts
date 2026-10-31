/**
 * PageCast — Community Broadcast Kit Domain Templates (ENH-03)
 *
 * Pre-defined, structured templates for grassroots broadcasters:
 * 1. Academic / Campus Notice (P500-P599)
 * 2. Community Health & Clinic Alert (P600-P699)
 * 3. Emergency Disaster & Weather Alert (P100-P199 / P700-P799)
 * 4. Local Civic & Municipal Notice (P400-P499)
 *
 * Provides bilingual presets (English / Hindi) that generate
 * clean structured text suitable for direct sentence segmentation,
 * SHA-256 provenance tracking, and 40x25 Teletext compilation.
 */

export type CommunityTemplateCategory = "academic" | "health" | "emergency" | "civic";

export interface CommunityTemplateField {
  readonly key: string;
  readonly label: string;
  readonly placeholder: string;
  readonly defaultValues: { readonly en: string; readonly hi: string };
  readonly required?: boolean;
  readonly multiline?: boolean;
}

export interface CommunityTemplateResult {
  readonly title: string;
  readonly siteName: string;
  readonly byline: string;
  readonly textContent: string;
  readonly targetPageNumber: number;
  readonly language: "en" | "hi";
}

export interface CommunityTemplate {
  readonly id: string;
  readonly name: string;
  readonly category: CommunityTemplateCategory;
  readonly recommendedPage: number;
  readonly description: string;
  readonly fields: readonly CommunityTemplateField[];
  readonly buildStructuredText: (
    values: Record<string, string>,
    lang: "en" | "hi"
  ) => CommunityTemplateResult;
}

// 1. Academic / Campus Notice
const ACADEMIC_CAMPUS_TEMPLATE: CommunityTemplate = {
  id: "academic-notice",
  name: "Academic & Campus Notice",
  category: "academic",
  recommendedPage: 501,
  description:
    "End-semester examination timetables, hall passes, room relocations, and registrar announcements.",
  fields: [
    {
      key: "institution",
      label: "Institution / Department",
      placeholder: "e.g. National Institute of Technology",
      defaultValues: {
        en: "National Institute of Technology",
        hi: "राष्ट्रीय प्रौद्योगिकी संस्थान",
      },
      required: true,
    },
    {
      key: "title",
      label: "Notice Subject / Title",
      placeholder: "e.g. End-Semester Examination Schedule & Room Allocations",
      defaultValues: {
        en: "End-Semester Examination Schedule & Room Allocations",
        hi: "सत्र-अंत परीक्षा समय सारिणी एवं कक्ष आवंटन",
      },
      required: true,
    },
    {
      key: "effectivePeriod",
      label: "Effective Dates & Hours",
      placeholder: "e.g. Nov 03 - Nov 18, 2026",
      defaultValues: {
        en: "03 Nov - 18 Nov 2026",
        hi: "03 नवंबर - 18 नवंबर 2026",
      },
      required: true,
    },
    {
      key: "announcements",
      label: "Key Announcements / Instructions",
      placeholder: "Numbered or bulleted list of essential instructions",
      multiline: true,
      defaultValues: {
        en: "1. Morning session runs 09:30 to 12:30 IST; afternoon session runs 14:00 to 17:00 IST.\n2. Hall tickets mandatory at Gate 2 entrance with valid student identity cards.\n3. Mobile phones and electronic smartwatches are strictly prohibited in Exam Block B.\n4. Special medical assistance desk is operational in Hall C throughout exam hours.",
        hi: "1. सुबह का सत्र 09:30 से 12:30 तक और दोपहर का सत्र 14:00 से 17:00 तक रहेगा।\n2. गेट 2 पर छात्र पहचान पत्र और प्रवेश पत्र अनिवार्य है।\n3. परीक्षा ब्लॉक बी में मोबाइल फोन और स्मार्ट घड़ियां पूरी तरह प्रतिबंधित हैं।\n4. हॉल सी में आपातकालीन चिकित्सा डेस्क परीक्षा के दौरान निरंतर सक्रिय रहेगा।",
      },
      required: true,
    },
    {
      key: "contact",
      label: "Helpline / Office Desk",
      placeholder: "e.g. Controller of Examinations • Room 104 • ext 4402",
      defaultValues: {
        en: "Controller of Examinations • Room 104 • Desk ext 4402",
        hi: "परीक्षा नियंत्रक कार्यालय • कक्ष 104 • दूरभाष 4402",
      },
      required: true,
    },
  ],
  buildStructuredText: (values, lang) => {
    const institution =
      values.institution || ACADEMIC_CAMPUS_TEMPLATE.fields[0].defaultValues[lang];
    const title = values.title || ACADEMIC_CAMPUS_TEMPLATE.fields[1].defaultValues[lang];
    const period = values.effectivePeriod || ACADEMIC_CAMPUS_TEMPLATE.fields[2].defaultValues[lang];
    const announcements =
      values.announcements || ACADEMIC_CAMPUS_TEMPLATE.fields[3].defaultValues[lang];
    const contact = values.contact || ACADEMIC_CAMPUS_TEMPLATE.fields[4].defaultValues[lang];

    const textContent = [
      `${title}.`,
      lang === "hi"
        ? `यह आधिकारिक सूचना ${institution} द्वारा जारी की गई है। प्रभावी अवधि: ${period}।`
        : `Official campus broadcast issued by ${institution}. Effective schedule: ${period}.`,
      announcements,
      lang === "hi"
        ? `पूछताछ एवं सहायता संपर्क: ${contact}।`
        : `Inquiries and support: ${contact}.`,
    ].join("\n\n");

    return {
      title,
      siteName: institution,
      byline: "Academic Registrar Desk",
      textContent,
      targetPageNumber: 501,
      language: lang,
    };
  },
};

// 2. Community Health & Clinic Alert
const COMMUNITY_HEALTH_TEMPLATE: CommunityTemplate = {
  id: "health-clinic",
  name: "Community Health & Clinic Alert",
  category: "health",
  recommendedPage: 601,
  description:
    "Vaccination camps, dispensary timings, water boil advisories, and public sanitation alerts.",
  fields: [
    {
      key: "facility",
      label: "Health Facility / Dispensary",
      placeholder: "e.g. District Primary Health Centre",
      defaultValues: {
        en: "District Primary Health Centre",
        hi: "जिला प्राथमिक स्वास्थ्य केंद्र",
      },
      required: true,
    },
    {
      key: "title",
      label: "Public Health Subject",
      placeholder: "e.g. Free Measles & Rubella Vaccination Drive",
      defaultValues: {
        en: "Free Measles & Rubella Vaccination Drive",
        hi: "निःशुल्क खसरा एवं रूबेला टीकाकरण अभियान",
      },
      required: true,
    },
    {
      key: "schedule",
      label: "Clinic Timings & Location",
      placeholder: "e.g. Saturday 07 Nov & Sunday 08 Nov • 08:00 - 16:00 IST",
      defaultValues: {
        en: "Saturday 07 Nov & Sunday 08 Nov • 08:00 - 16:00 IST",
        hi: "शनिवार 07 नवंबर एवं रविवार 08 नवंबर • 08:00 - 16:00",
      },
      required: true,
    },
    {
      key: "guidelines",
      label: "Health Guidelines / Eligibility",
      placeholder: "Key clinical instructions for residents",
      multiline: true,
      defaultValues: {
        en: "1. All infants and children aged 9 months to 5 years eligible for free booster dose.\n2. Please carry Mother-Child Protection Card (MCP) or government identity card.\n3. Oral rehydration salt (ORS) packets and pediatric vitamin-A drops provided free.\n4. Residents advised to boil drinking water for 10 minutes following recent municipal pipe repairs.",
        hi: "1. 9 माह से 5 वर्ष के सभी बच्चे निःशुल्क बूस्टर खुराक के पात्र हैं।\n2. कृपया मातृ एवं शिशु सुरक्षा कार्ड (एमसीपी) या पहचान पत्र साथ लाएं।\n3. ओआरएस पैकेट एवं बाल विटामिन-ए की खुराक निःशुल्क उपलब्ध कराई जाएगी।\n4. हालिया पाइपलाइन मरम्मत के कारण नागरिक पीने का पानी 10 मिनट उबालकर पिएं।",
      },
      required: true,
    },
    {
      key: "helpline",
      label: "Emergency Medical Contact",
      placeholder: "e.g. National Health Helpline: 1075 • Ambulance: 108",
      defaultValues: {
        en: "National Health Helpline: 1075 • Emergency Ambulance: 108",
        hi: "राष्ट्रीय स्वास्थ्य हेल्पलाइन: 1075 • एम्बुलेंस सेवा: 108",
      },
      required: true,
    },
  ],
  buildStructuredText: (values, lang) => {
    const facility = values.facility || COMMUNITY_HEALTH_TEMPLATE.fields[0].defaultValues[lang];
    const title = values.title || COMMUNITY_HEALTH_TEMPLATE.fields[1].defaultValues[lang];
    const schedule = values.schedule || COMMUNITY_HEALTH_TEMPLATE.fields[2].defaultValues[lang];
    const guidelines = values.guidelines || COMMUNITY_HEALTH_TEMPLATE.fields[3].defaultValues[lang];
    const helpline = values.helpline || COMMUNITY_HEALTH_TEMPLATE.fields[4].defaultValues[lang];

    const textContent = [
      `${title}.`,
      lang === "hi"
        ? `सार्वजनिक स्वास्थ्य सूचना जारीकर्ता: ${facility}। शिविर समय: ${schedule}।`
        : `Public health bulletin issued by ${facility}. Operating schedule: ${schedule}.`,
      guidelines,
      lang === "hi"
        ? `आपातकालीन सहायता संपर्क: ${helpline}।`
        : `Emergency medical assistance: ${helpline}.`,
    ].join("\n\n");

    return {
      title,
      siteName: facility,
      byline: "Chief Medical Officer Desk",
      textContent,
      targetPageNumber: 601,
      language: lang,
    };
  },
};

// 3. Emergency Disaster & Weather Alert
const EMERGENCY_DISASTER_TEMPLATE: CommunityTemplate = {
  id: "emergency-alert",
  name: "Emergency Disaster & Weather Alert",
  category: "emergency",
  recommendedPage: 101,
  description:
    "Cyclone warnings, flood evacuation corridors, emergency relief shelters, and crisis dispatch.",
  fields: [
    {
      key: "authority",
      label: "Issuing Authority",
      placeholder: "e.g. State Disaster Management Authority (SDMA)",
      defaultValues: {
        en: "State Disaster Management Authority (SDMA)",
        hi: "राज्य आपदा प्रबंधन प्राधिकरण",
      },
      required: true,
    },
    {
      key: "title",
      label: "Emergency Bulletin Title",
      placeholder: "e.g. RED ALERT: Severe Tropical Cyclone Warning & Evacuation",
      defaultValues: {
        en: "RED ALERT: Severe Tropical Cyclone Warning & Evacuation",
        hi: "रेड अलर्ट: तीव्र चक्रवात चेतावनी एवं तटीय निकासी निर्देश",
      },
      required: true,
    },
    {
      key: "validity",
      label: "Alert Level & Window",
      placeholder: "e.g. Severe Red Alert • Next 36 Hours",
      defaultValues: {
        en: "Severe Red Alert • Next 36 Hours",
        hi: "उच्चतम रेड अलर्ट • आगामी 36 घंटे",
      },
      required: true,
    },
    {
      key: "actions",
      label: "Mandatory Civil Protection Actions",
      placeholder: "Evacuation routes, shelter locations, power precautions",
      multiline: true,
      defaultValues: {
        en: "1. Gale wind speeds of 90 to 110 kmph projected across coastal zones within 18 hours.\n2. Mandatory evacuation active for all settlements within 3 kilometres of the shoreline.\n3. Designated cyclone shelters open at Govt Higher Secondary School and Town Community Hall.\n4. Rations, potable water, first-aid kits, and power generators are fully stocked.\n5. Keep mobile phones charged, secure loose tin roofing, and stay indoors after sunset.",
        hi: "1. अगले 18 घंटों में तटीय क्षेत्रों में 90 से 110 किमी/घंटा की गति से तेज हवाओं का अनुमान है।\n2. समुद्र तट से 3 किमी के भीतर स्थित बस्तियों को अनिवार्य रूप से खाली करने का आदेश।\n3. सरकारी उच्चतर माध्यमिक विद्यालय और टाउन हॉल में राहत आश्रय सक्रिय हैं।\n4. सभी आश्रयों में सूखा राशन, पीने का पानी, प्राथमिक चिकित्सा और जनरेटर उपलब्ध हैं।\n5. मोबाइल चार्ज रखें, छत की टिन सुरक्षित करें और सूर्यास्त के बाद घर के अंदर रहें।",
      },
      required: true,
    },
    {
      key: "controlRoom",
      label: "Emergency Dispatch & Helplines",
      placeholder: "e.g. State Emergency Control: 1077 / 112 • Coastal Rescue: 1554",
      defaultValues: {
        en: "State Disaster Control Room: 1077 / 112 • Coast Guard Rescue: 1554",
        hi: "राज्य आपदा नियंत्रण कक्ष: 1077 / 112 • तटरक्षक बचाव: 1554",
      },
      required: true,
    },
  ],
  buildStructuredText: (values, lang) => {
    const authority = values.authority || EMERGENCY_DISASTER_TEMPLATE.fields[0].defaultValues[lang];
    const title = values.title || EMERGENCY_DISASTER_TEMPLATE.fields[1].defaultValues[lang];
    const validity = values.validity || EMERGENCY_DISASTER_TEMPLATE.fields[2].defaultValues[lang];
    const actions = values.actions || EMERGENCY_DISASTER_TEMPLATE.fields[3].defaultValues[lang];
    const controlRoom =
      values.controlRoom || EMERGENCY_DISASTER_TEMPLATE.fields[4].defaultValues[lang];

    const textContent = [
      `${title}.`,
      lang === "hi"
        ? `आपातकालीन सूचना जारीकर्ता: ${authority}। चेतावनी स्तर: ${validity}।`
        : `Urgent emergency broadcast issued by ${authority}. Threat severity: ${validity}.`,
      actions,
      lang === "hi"
        ? `24 घंटे आपातकालीन संपर्क: ${controlRoom}।`
        : `24-Hour Emergency Dispatch: ${controlRoom}.`,
    ].join("\n\n");

    return {
      title,
      siteName: authority,
      byline: "Disaster Operations Cell",
      textContent,
      targetPageNumber: 101,
      language: lang,
    };
  },
};

// 4. Local Civic & Municipal Notice
const CIVIC_MUNICIPAL_TEMPLATE: CommunityTemplate = {
  id: "civic-municipal",
  name: "Local Civic & Municipal Notice",
  category: "civic",
  recommendedPage: 401,
  description:
    "Scheduled water rationing, feeder maintenance power cuts, public ration distribution, and hearings.",
  fields: [
    {
      key: "municipality",
      label: "Municipal Authority / Ward",
      placeholder: "e.g. City Municipal Corporation • Water & Works Dept",
      defaultValues: {
        en: "City Municipal Corporation • Water & Works Dept",
        hi: "नगर निगम • जल एवं निर्माण विभाग",
      },
      required: true,
    },
    {
      key: "title",
      label: "Civic Notice Subject",
      placeholder: "e.g. Scheduled Water Rationing & Infrastructure Maintenance",
      defaultValues: {
        en: "Scheduled Water Rationing & Infrastructure Maintenance",
        hi: "जल आपूर्ति राशनिंग एवं पाइपलाइन मरम्मत सूचना",
      },
      required: true,
    },
    {
      key: "duration",
      label: "Affected Dates & Time",
      placeholder: "e.g. 04 Nov to 06 Nov 2026",
      defaultValues: {
        en: "04 Nov to 06 Nov 2026",
        hi: "04 नवंबर से 06 नवंबर 2026",
      },
      required: true,
    },
    {
      key: "details",
      label: "Civic Details & Alternate Arrangements",
      placeholder: "Areas affected, tanker points, schedule",
      multiline: true,
      defaultValues: {
        en: "1. Main junction pipeline maintenance scheduled for Sectors 4, 7, 9 and Old Bazaar.\n2. Piped water supply restricted to morning hours 06:00 to 08:30 IST only.\n3. Municipal mobile water tankers deployed at main market squares every 2 hours.\n4. Electrical feeder line 3 shutdown for safety on Thursday 10:00 to 14:00 IST.",
        hi: "1. सेक्टर 4, 7, 9 और पुराने बाजार में मुख्य पाइपलाइन मरम्मत का कार्य प्रस्तावित है।\n2. नल से जल आपूर्ति केवल सुबह 06:00 से 08:30 बजे तक सीमित रहेगी।\n3. मुख्य चौराहों पर प्रत्येक 2 घंटे में निगम के पेयजल टैंकर उपलब्ध रहेंगे।\n4. सुरक्षा कारणों से गुरुवार को 10:00 से 14:00 बजे तक फीडर 3 की बिजली बंद रहेगी।",
      },
      required: true,
    },
    {
      key: "complaints",
      label: "Civic Helpline / Citizen Cell",
      placeholder: "e.g. Municipal Helpline: 1916 • WhatsApp: 94000-00100",
      defaultValues: {
        en: "Municipal Citizen Helpline: 1916 • WhatsApp Complaints: 94000-00100",
        hi: "नगर निगम हेल्पलाइन: 1916 • व्हाट्सएप शिकायत सेल: 94000-00100",
      },
      required: true,
    },
  ],
  buildStructuredText: (values, lang) => {
    const municipality =
      values.municipality || CIVIC_MUNICIPAL_TEMPLATE.fields[0].defaultValues[lang];
    const title = values.title || CIVIC_MUNICIPAL_TEMPLATE.fields[1].defaultValues[lang];
    const duration = values.duration || CIVIC_MUNICIPAL_TEMPLATE.fields[2].defaultValues[lang];
    const details = values.details || CIVIC_MUNICIPAL_TEMPLATE.fields[3].defaultValues[lang];
    const complaints = values.complaints || CIVIC_MUNICIPAL_TEMPLATE.fields[4].defaultValues[lang];

    const textContent = [
      `${title}.`,
      lang === "hi"
        ? `नागरिक सूचना जारीकर्ता: ${municipality}। प्रभावित अवधि: ${duration}।`
        : `Civic bulletin issued by ${municipality}. Applicable timeframe: ${duration}.`,
      details,
      lang === "hi"
        ? `नागरिक शिकायत एवं सहायता: ${complaints}।`
        : `Citizen support and assistance desk: ${complaints}.`,
    ].join("\n\n");

    return {
      title,
      siteName: municipality,
      byline: "Municipal Public Relations",
      textContent,
      targetPageNumber: 401,
      language: lang,
    };
  },
};

export const COMMUNITY_TEMPLATES: readonly CommunityTemplate[] = [
  ACADEMIC_CAMPUS_TEMPLATE,
  COMMUNITY_HEALTH_TEMPLATE,
  EMERGENCY_DISASTER_TEMPLATE,
  CIVIC_MUNICIPAL_TEMPLATE,
];

export function getCommunityTemplates(): readonly CommunityTemplate[] {
  return COMMUNITY_TEMPLATES;
}

export function getCommunityTemplateById(id: string): CommunityTemplate | undefined {
  return COMMUNITY_TEMPLATES.find((t) => t.id === id);
}

export function instantiateCommunityTemplate(
  templateId: string,
  userValues: Record<string, string> = {},
  lang: "en" | "hi" = "en"
): CommunityTemplateResult {
  const template = getCommunityTemplateById(templateId);
  if (!template) {
    throw new Error(`Unknown community template ID: "${templateId}"`);
  }

  // Merge default values
  const mergedValues: Record<string, string> = {};
  for (const field of template.fields) {
    mergedValues[field.key] = userValues[field.key] || field.defaultValues[lang] || "";
  }

  return template.buildStructuredText(mergedValues, lang);
}
