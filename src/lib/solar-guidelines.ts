// Solar System Installation Guidelines, Recommendations, and Diagrams
// This module provides educational content and SVG diagrams for solar system installation

export interface Guideline {
  id: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  icon: string; // lucide icon name
  priority: 'critical' | 'important' | 'recommended';
}

export interface SystemDiagram {
  id: string;
  titleAr: string;
  titleEn: string;
  type: 'on-grid' | 'off-grid' | 'hybrid';
  svgPath: string; // SVG markup for the diagram
}

// ============= INSTALLATION GUIDELINES =============
export function getInstallationGuidelines(
  systemType: 'on-grid' | 'off-grid' | 'hybrid',
  systemVoltage: number,
  language: 'ar' | 'en'
): Guideline[] {
  const allGuidelines: Guideline[] = [
    // Critical guidelines
    {
      id: 'safety-first',
      titleAr: 'السلامة أولاً',
      titleEn: 'Safety First',
      contentAr: 'قبل البدء في أي عمل تركيبي، تأكد من فصل التيار الكهربائي بالكامل. ارتدِ معدات الحماية الشخصية (قفازات معزولة، نظارات حماية، أحذية عازلة). لا تعمل بمفردك - يجب وجود شخص آخر للطوارئ. تأكد من أن جميع الكابلات والوصلات في حالة جيدة قبل التوصيل.',
      contentEn: 'Before starting any installation work, ensure all power is completely disconnected. Wear personal protective equipment (insulated gloves, safety glasses, insulated boots). Never work alone - another person must be present for emergencies. Verify all cables and connections are in good condition before connecting.',
      icon: 'Shield',
      priority: 'critical',
    },
    {
      id: 'panel-mounting',
      titleAr: 'تركيب الألواح الشمسية',
      titleEn: 'Solar Panel Mounting',
      contentAr: `ثبّت الألواح على الهيكل المعدني بزاوية الميل المثلى للموقع. اترك مسافة كافية بين الألواح والسطح (15-20 سم) لضمان التهوية. استخدم براغي مقاومة للصدأ ومانعات تسرب مناسبة. تأكد من أن الهيكل يتحمل سرعة الرياح القصوى في المنطقة (عادة 150 كم/ساعة). وجّه الألواح نحو الجنوب في نصف الكرة الشمالي ونحو الشمال في نصف الكرة الجنوبي.`,
      contentEn: `Mount panels on the metal structure at the optimal tilt angle for the location. Leave sufficient space between panels and roof (15-20 cm) for ventilation. Use stainless steel bolts and appropriate sealants. Ensure the structure can withstand maximum wind speeds in the area (typically 150 km/h). Orient panels towards the south in the Northern Hemisphere and north in the Southern Hemisphere.`,
      icon: 'Sun',
      priority: 'critical',
    },
    {
      id: 'wiring-dc',
      titleAr: 'توصيلات التيار المستمر DC',
      titleEn: 'DC Wiring',
      contentAr: `استخدم كابلات شمسية معتمدة (PV1-F) مقاومة للأشعة فوق البنفسجية ودرجات الحرارة العالية. لا تتجاوز نسبة هبوط الجهد 2% في دوائر DC. استخدم موصلات MC4 المعتمدة لجميع توصيلات الألواح. تأكد من أن القطبية صحيحة قبل التوصيل. ضع صمامات حماية (Diodes) لمنع تدفق التيار العكسي. ركّب قواطع DC بين كل سلسلة ألواح وصندوق التجميع.`,
      contentEn: `Use certified solar cables (PV1-F) resistant to UV and high temperatures. Do not exceed 2% voltage drop in DC circuits. Use approved MC4 connectors for all panel connections. Verify correct polarity before connecting. Install blocking diodes to prevent reverse current flow. Install DC breakers between each string and the combiner box.`,
      icon: 'Cable',
      priority: 'critical',
    },
    {
      id: 'battery-installation',
      titleAr: 'تركيب البطاريات',
      titleEn: 'Battery Installation',
      contentAr: `ركّب البطاريات في مكان جيد التهوية وبعيداً عن مصادر الحرارة والنار. لبطاريات حمض الرصاص: تأكد من التهوية الكافية لمنع تراكم غاز الهيدروجين. لا تدخن أو تستخدم شعلة قريبة من البطاريات. ركّب صندوق حماية غير موصل للكهرباء حول البطاريات. استخدم كابلات بنفس الطول والمقطع لجميع وصلات التوالي والتوازي. تأكد من ربط القطب السالب أولاً عند التوصيل والفصل.`,
      contentEn: `Install batteries in a well-ventilated area away from heat sources and fire. For lead-acid batteries: ensure adequate ventilation to prevent hydrogen gas accumulation. No smoking or open flames near batteries. Install a non-conductive protective enclosure around batteries. Use cables of the same length and cross-section for all series and parallel connections. Always connect negative terminal first when connecting and disconnecting.`,
      icon: 'Battery',
      priority: 'critical',
    },
    {
      id: 'inverter-setup',
      titleAr: 'إعداد العاكس (الإنفرتر)',
      titleEn: 'Inverter Setup',
      contentAr: `ركّب العاكس في مكان جاف وجيد التهوية بعيداً عن أشعة الشمس المباشرة. تأكد من أن العاكس مناسب لنوع النظام (On-Grid/Off-Grid/Hybrid). برمج إعدادات العاكس حسب مواصفات البطاريات وجهد النظام. للأنظمة المتصلة بالشبكة: تأكد من وجود موافقة شركة الكهرباء وتركيب عداد ثنائي الاتجاه. اختبر العاكس بدون حمل أولاً ثم أضف الأحمال تدريجياً.`,
      contentEn: `Install the inverter in a dry, well-ventilated area away from direct sunlight. Ensure the inverter is appropriate for the system type (On-Grid/Off-Grid/Hybrid). Program inverter settings according to battery specifications and system voltage. For grid-tied systems: ensure utility company approval and install a bidirectional meter. Test the inverter without load first, then add loads gradually.`,
      icon: 'Zap',
      priority: 'critical',
    },
    {
      id: 'grounding',
      titleAr: 'التأريض والحماية من الصواعق',
      titleEn: 'Grounding & Lightning Protection',
      contentAr: `ركّب نظام تأريض موحد للنظام الشمسي بقاومة لا تتجاوز 5 أوم. أوصل إطار الألواح المعدني بنظام التأريض. ركّب مانع صواعق (SPD) على جانبي DC وAC. تأكد من توصيل جميع المعدات المعدنية (العاكس، صندوق التجميع، لوحة التوزيع) بنظام التأريض. استخدم موصل نحاسي مقطع 16 مم² على الأقل للتأريض.`,
      contentEn: `Install a unified grounding system for the solar installation with resistance not exceeding 5 ohms. Connect the metal panel frame to the grounding system. Install Surge Protection Devices (SPD) on both DC and AC sides. Ensure all metallic equipment (inverter, combiner box, distribution panel) is connected to the grounding system. Use copper conductor with minimum 16 mm² cross-section for grounding.`,
      icon: 'Shield',
      priority: 'critical',
    },
    // Important guidelines
    {
      id: 'combiner-box',
      titleAr: 'صندوق تجميع DC',
      titleEn: 'DC Combiner Box',
      contentAr: `استخدم صندوق تجميع مع IP65 على الأقل للحماية من الرطوبة والغبار. ركّب قاطع DC وفاصل عزل لكل سلسلة ألواح. أضف فيوز حماية لكل سلسلة (عادة 10-15 أمبير). ركّب SPD (مانع صواعق) على مدخل DC. تأكد من توصيل التأريض بشكل صحيح. استخدم محطات توصيل مناسبة لمقطع الكابلات المستخدمة.`,
      contentEn: `Use a combiner box with at least IP65 rating for moisture and dust protection. Install a DC breaker and disconnect switch for each string. Add a protection fuse for each string (typically 10-15 amps). Install SPD (surge protection) on the DC input. Ensure proper grounding connection. Use appropriate terminal blocks for the cable cross-sections used.`,
      icon: 'Shield',
      priority: 'important',
    },
    {
      id: 'charge-controller',
      titleAr: 'منظم الشحن',
      titleEn: 'Charge Controller',
      contentAr: `اختر منظم شحن MPPT للأنظمة فوق 500 واط للحصول على كفاءة أعلى. تأكد من أن منظم الشحن يتحمل أقصى تيار مقصر (Isc) × 1.25 للألواح. ركّب منظم الشحن قريباً من البطاريات لتقليل هبوط الجهد. اضبط إعدادات الشحن حسب نوع البطارية (Bulk/Absorption/Float voltages). للبطاريات الليثيوم: استخدم منظم شحن متوافق مع بروتوكول BMS.`,
      contentEn: `Choose an MPPT charge controller for systems above 500W for higher efficiency. Ensure the controller can handle maximum short-circuit current (Isc) × 1.25 from the panels. Install the controller close to the batteries to minimize voltage drop. Set charging parameters according to battery type (Bulk/Absorption/Float voltages). For lithium batteries: use a controller compatible with BMS protocol.`,
      icon: 'Gauge',
      priority: 'important',
    },
    {
      id: 'maintenance',
      titleAr: 'الصيانة الدورية',
      titleEn: 'Periodic Maintenance',
      contentAr: `نظّف الألواح الشمسية كل 2-4 أسابيع (أكثر في المناطق المتربة). افحص الكابلات والتوصيلات كل 3 أشهر. للبطاريات حمض الرصاص: افحص مستوى المحلول كل شهر ونظّف الأقطاب. سجّل قراءات الفولتمتر والأمبير يومياً. افحص نظام التأريض سنوياً. تأكد من عمل مانعات الصواعق بشكل صحيح. افحص درجة حرارة العاكس أثناء العمل.`,
      contentEn: `Clean solar panels every 2-4 weeks (more often in dusty areas). Inspect cables and connections every 3 months. For lead-acid batteries: check electrolyte level monthly and clean terminals. Record voltmeter and ammeter readings daily. Inspect the grounding system annually. Verify surge protectors are functioning properly. Check inverter temperature during operation.`,
      icon: 'Wrench',
      priority: 'important',
    },
    {
      id: 'monitoring',
      titleAr: 'المراقبة والتحكم',
      titleEn: 'Monitoring & Control',
      contentAr: `ركّب نظام مراقبة عن بُعد (WiFi/GSM) لمتابعة أداء النظام. سجّل الإنتاج اليومي والشهري وقارنه بالقيم المحسوبة. راقب حالة الشحن والتفريغ للبطاريات. أنشئ تنبيهات للأعطال والقيم غير الطبيعية. استخدم بيانات المراقبة لتحسين أداء النظام بمرور الوقت.`,
      contentEn: `Install a remote monitoring system (WiFi/GSM) to track system performance. Record daily and monthly production and compare with calculated values. Monitor battery charge/discharge status. Set up alerts for faults and abnormal values. Use monitoring data to optimize system performance over time.`,
      icon: 'BarChart3',
      priority: 'recommended',
    },
  ];

  // Filter guidelines based on system type
  return allGuidelines.filter(g => {
    if (systemType === 'on-grid' && g.id === 'battery-installation') return false;
    if (systemType === 'on-grid' && g.id === 'charge-controller') return false;
    return true;
  });
}

// ============= SYSTEM DIAGRAMS (SVG) =============
export function getSystemDiagram(
  type: 'on-grid' | 'off-grid' | 'hybrid',
  language: 'ar' | 'en'
): { title: string; svg: string } {
  const isAr = language === 'ar';

  switch (type) {
    case 'off-grid':
      return {
        title: isAr ? 'مخطط المنظومة المستقلة (Off-Grid)' : 'Off-Grid System Diagram',
        svg: `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" dir="${isAr ? 'rtl' : 'ltr'}">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#F59E0B"/>
    </marker>
  </defs>
  
  <!-- Background -->
  <rect width="800" height="500" fill="${isAr ? '#1a1a2e' : '#f8fafc'}" rx="12"/>
  
  <!-- Title -->
  <text x="400" y="30" text-anchor="middle" fill="${isAr ? '#F59E0B' : '#1e293b'}" font-size="16" font-weight="bold">${isAr ? 'مخطط المنظومة الشمسية المستقلة (Off-Grid)' : 'Off-Grid Solar System Diagram'}</text>
  
  <!-- Solar Panels -->
  <rect x="50" y="70" width="120" height="80" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2" rx="8"/>
  <text x="110" y="105" text-anchor="middle" fill="#92400E" font-size="12" font-weight="bold">☀️</text>
  <text x="110" y="125" text-anchor="middle" fill="#92400E" font-size="11">${isAr ? 'الألواح الشمسية' : 'Solar Panels'}</text>
  <text x="110" y="140" text-anchor="middle" fill="#92400E" font-size="9">PV Array</text>
  
  <!-- DC Isolator -->
  <rect x="230" y="85" width="100" height="50" fill="#DBEAFE" stroke="#3B82F6" stroke-width="2" rx="8"/>
  <text x="280" y="115" text-anchor="middle" fill="#1E40AF" font-size="10">${isAr ? 'قاطع DC + صندوق تجميع' : 'DC Breaker + Combiner'}</text>
  
  <!-- Charge Controller -->
  <rect x="400" y="85" width="120" height="50" fill="#D1FAE5" stroke="#10B981" stroke-width="2" rx="8"/>
  <text x="460" y="110" text-anchor="middle" fill="#065F46" font-size="11" font-weight="bold">${isAr ? 'منظم الشحن' : 'Charge Controller'}</text>
  <text x="460" y="125" text-anchor="middle" fill="#065F46" font-size="9">MPPT/PWM</text>
  
  <!-- Battery Bank -->
  <rect x="400" y="200" width="120" height="70" fill="#EDE9FE" stroke="#8B5CF6" stroke-width="2" rx="8"/>
  <text x="460" y="235" text-anchor="middle" fill="#5B21B6" font-size="11" font-weight="bold">🔋</text>
  <text x="460" y="255" text-anchor="middle" fill="#5B21B6" font-size="10">${isAr ? 'بنك البطاريات' : 'Battery Bank'}</text>
  
  <!-- Inverter -->
  <rect x="400" y="330" width="120" height="50" fill="#FEE2E2" stroke="#EF4444" stroke-width="2" rx="8"/>
  <text x="460" y="355" text-anchor="middle" fill="#991B1B" font-size="11" font-weight="bold">${isAr ? 'العاكس' : 'Inverter'}</text>
  <text x="460" y="370" text-anchor="middle" fill="#991B1B" font-size="9">DC → AC</text>
  
  <!-- AC Breaker -->
  <rect x="580" y="340" width="90" height="40" fill="#DBEAFE" stroke="#3B82F6" stroke-width="2" rx="8"/>
  <text x="625" y="365" text-anchor="middle" fill="#1E40AF" font-size="10">${isAr ? 'قاطع AC' : 'AC Breaker'}</text>
  
  <!-- Load -->
  <rect x="620" y="200" width="120" height="80" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2" rx="8"/>
  <text x="680" y="240" text-anchor="middle" fill="#92400E" font-size="11" font-weight="bold">🏠</text>
  <text x="680" y="260" text-anchor="middle" fill="#92400E" font-size="10">${isAr ? 'الأحمال الكهربائية' : 'Electrical Loads'}</text>
  
  <!-- Grounding -->
  <rect x="50" y="430" width="700" height="40" fill="${isAr ? '#2d2d44' : '#F1F5F9'}" stroke="#64748B" stroke-width="1" rx="6" stroke-dasharray="5,5"/>
  <text x="400" y="455" text-anchor="middle" fill="#64748B" font-size="11">⏚ ${isAr ? 'نظام التأريض والحماية من الصواعق' : 'Grounding & Lightning Protection System'}</text>
  
  <!-- Arrows -->
  <line x1="170" y1="110" x2="228" y2="110" stroke="#F59E0B" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="330" y1="110" x2="398" y2="110" stroke="#F59E0B" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="460" y1="135" x2="460" y2="198" stroke="#F59E0B" stroke-width="2" marker-end="url(#arrowhead)"/>
  <text x="475" y="170" fill="#64748B" font-size="9">DC</text>
  <line x1="400" y1="235" x2="340" y2="235" stroke="#8B5CF6" stroke-width="2" marker-end="url(#arrowhead)" stroke-dasharray="5,3"/>
  <line x1="340" y1="235" x2="340" y2="355" stroke="#8B5CF6" stroke-width="2" marker-end="url(#arrowhead)" stroke-dasharray="5,3"/>
  <line x1="340" y1="355" x2="398" y2="355" stroke="#8B5CF6" stroke-width="2" marker-end="url(#arrowhead)" stroke-dasharray="5,3"/>
  <text x="345" y="300" fill="#64748B" font-size="9">DC</text>
  <line x1="520" y1="355" x2="578" y2="355" stroke="#EF4444" stroke-width="2" marker-end="url(#arrowhead)"/>
  <text x="550" y="348" fill="#64748B" font-size="9">AC</text>
  <line x1="625" y1="380" x2="625" y2="420" stroke="#64748B" stroke-width="1" stroke-dasharray="3,3"/>
  <line x1="460" y1="270" x2="460" y2="328" stroke="#F59E0B" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="670" y1="340" x2="680" y2="282" stroke="#EF4444" stroke-width="2" marker-end="url(#arrowhead)"/>
  
  <!-- Labels -->
  <text x="200" y="100" fill="#64748B" font-size="9">DC</text>
  <text x="365" y="100" fill="#64748B" font-size="9">DC</text>
</svg>`,
      };

    case 'on-grid':
      return {
        title: isAr ? 'مخطط المنظومة المتصلة بالشبكة (On-Grid)' : 'On-Grid System Diagram',
        svg: `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" dir="${isAr ? 'rtl' : 'ltr'}">
  <defs>
    <marker id="arrowhead2" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#F59E0B"/>
    </marker>
  </defs>
  
  <rect width="800" height="500" fill="${isAr ? '#1a1a2e' : '#f8fafc'}" rx="12"/>
  
  <text x="400" y="30" text-anchor="middle" fill="${isAr ? '#F59E0B' : '#1e293b'}" font-size="16" font-weight="bold">${isAr ? 'مخطط المنظومة المتصلة بالشبكة (On-Grid)' : 'On-Grid Solar System Diagram'}</text>
  
  <!-- Solar Panels -->
  <rect x="50" y="80" width="120" height="70" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2" rx="8"/>
  <text x="110" y="110" text-anchor="middle" fill="#92400E" font-size="12">☀️</text>
  <text x="110" y="130" text-anchor="middle" fill="#92400E" font-size="10">${isAr ? 'الألواح الشمسية' : 'Solar Panels'}</text>
  
  <!-- DC Breaker -->
  <rect x="230" y="90" width="100" height="50" fill="#DBEAFE" stroke="#3B82F6" stroke-width="2" rx="8"/>
  <text x="280" y="120" text-anchor="middle" fill="#1E40AF" font-size="10">${isAr ? 'قاطع DC' : 'DC Breaker'}</text>
  
  <!-- Grid-Tie Inverter -->
  <rect x="400" y="80" width="130" height="60" fill="#FEE2E2" stroke="#EF4444" stroke-width="2" rx="8"/>
  <text x="465" y="108" text-anchor="middle" fill="#991B1B" font-size="11" font-weight="bold">${isAr ? 'عاكس شبكي' : 'Grid-Tie Inverter'}</text>
  <text x="465" y="125" text-anchor="middle" fill="#991B1B" font-size="9">DC → AC</text>
  
  <!-- AC Breaker -->
  <rect x="400" y="200" width="130" height="40" fill="#DBEAFE" stroke="#3B82F6" stroke-width="2" rx="8"/>
  <text x="465" y="225" text-anchor="middle" fill="#1E40AF" font-size="10">${isAr ? 'قاطع AC رئيسي' : 'Main AC Breaker'}</text>
  
  <!-- Utility Meter -->
  <rect x="400" y="290" width="130" height="50" fill="#E0E7FF" stroke="#6366F1" stroke-width="2" rx="8"/>
  <text x="465" y="315" text-anchor="middle" fill="#3730A3" font-size="10" font-weight="bold">⚡</text>
  <text x="465" y="330" text-anchor="middle" fill="#3730A3" font-size="9">${isAr ? 'عداد ثنائي الاتجاه' : 'Net Meter'}</text>
  
  <!-- Grid -->
  <rect x="600" y="290" width="130" height="50" fill="#D1FAE5" stroke="#10B981" stroke-width="2" rx="8"/>
  <text x="665" y="320" text-anchor="middle" fill="#065F46" font-size="11" font-weight="bold">🏢</text>
  <text x="665" y="335" text-anchor="middle" fill="#065F46" font-size="9">${isAr ? 'شبكة الكهرباء' : 'Utility Grid'}</text>
  
  <!-- Load -->
  <rect x="600" y="180" width="130" height="70" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2" rx="8"/>
  <text x="665" y="215" text-anchor="middle" fill="#92400E" font-size="11" font-weight="bold">🏠</text>
  <text x="665" y="235" text-anchor="middle" fill="#92400E" font-size="10">${isAr ? 'الأحمال' : 'Loads'}</text>
  
  <!-- Grounding -->
  <rect x="50" y="430" width="700" height="40" fill="${isAr ? '#2d2d44' : '#F1F5F9'}" stroke="#64748B" stroke-width="1" rx="6" stroke-dasharray="5,5"/>
  <text x="400" y="455" text-anchor="middle" fill="#64748B" font-size="11">⏚ ${isAr ? 'نظام التأريض والحماية' : 'Grounding & Protection System'}</text>
  
  <!-- Arrows -->
  <line x1="170" y1="115" x2="228" y2="115" stroke="#F59E0B" stroke-width="2" marker-end="url(#arrowhead2)"/>
  <line x1="330" y1="115" x2="398" y2="115" stroke="#F59E0B" stroke-width="2" marker-end="url(#arrowhead2)"/>
  <line x1="530" y1="110" x2="600" y2="180" stroke="#EF4444" stroke-width="2" marker-end="url(#arrowhead2)"/>
  <line x1="465" y1="140" x2="465" y2="198" stroke="#F59E0B" stroke-width="2" marker-end="url(#arrowhead2)"/>
  <line x1="465" y1="240" x2="465" y2="288" stroke="#F59E0B" stroke-width="2" marker-end="url(#arrowhead2)"/>
  <line x1="530" y1="315" x2="598" y2="315" stroke="#10B981" stroke-width="2" marker-end="url(#arrowhead2)"/>
  <line x1="600" y1="305" x2="532" y2="305" stroke="#EF4444" stroke-width="2" marker-end="url(#arrowhead2)"/>
  
  <!-- Bi-directional label -->
  <text x="565" y="295" fill="#64748B" font-size="8">↔</text>
</svg>`,
      };

    case 'hybrid':
      return {
        title: isAr ? 'مخطط المنظومة الهجينة (Hybrid)' : 'Hybrid System Diagram',
        svg: `<svg viewBox="0 0 800 550" xmlns="http://www.w3.org/2000/svg" dir="${isAr ? 'rtl' : 'ltr'}">
  <defs>
    <marker id="arrowhead3" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#F59E0B"/>
    </marker>
  </defs>
  
  <rect width="800" height="550" fill="${isAr ? '#1a1a2e' : '#f8fafc'}" rx="12"/>
  
  <text x="400" y="30" text-anchor="middle" fill="${isAr ? '#F59E0B' : '#1e293b'}" font-size="16" font-weight="bold">${isAr ? 'مخطط المنظومة الهجينة (Hybrid)' : 'Hybrid Solar System Diagram'}</text>
  
  <!-- Solar Panels -->
  <rect x="50" y="70" width="120" height="70" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2" rx="8"/>
  <text x="110" y="100" text-anchor="middle" fill="#92400E" font-size="12">☀️</text>
  <text x="110" y="120" text-anchor="middle" fill="#92400E" font-size="10">${isAr ? 'الألواح الشمسية' : 'Solar Panels'}</text>
  
  <!-- DC Breaker -->
  <rect x="230" y="80" width="100" height="50" fill="#DBEAFE" stroke="#3B82F6" stroke-width="2" rx="8"/>
  <text x="280" y="110" text-anchor="middle" fill="#1E40AF" font-size="10">${isAr ? 'قاطع DC + تجميع' : 'DC Breaker + Combiner'}</text>
  
  <!-- Hybrid Inverter -->
  <rect x="400" y="65" width="140" height="80" fill="#FEE2E2" stroke="#EF4444" stroke-width="3" rx="8"/>
  <text x="470" y="95" text-anchor="middle" fill="#991B1B" font-size="11" font-weight="bold">${isAr ? 'العاكس الهجين' : 'Hybrid Inverter'}</text>
  <text x="470" y="115" text-anchor="middle" fill="#991B1B" font-size="9">DC ↔ AC + MPPT</text>
  <text x="470" y="132" text-anchor="middle" fill="#991B1B" font-size="8">+ Battery Charger</text>
  
  <!-- Battery Bank -->
  <rect x="50" y="250" width="120" height="70" fill="#EDE9FE" stroke="#8B5CF6" stroke-width="2" rx="8"/>
  <text x="110" y="280" text-anchor="middle" fill="#5B21B6" font-size="11" font-weight="bold">🔋</text>
  <text x="110" y="300" text-anchor="middle" fill="#5B21B6" font-size="10">${isAr ? 'بنك البطاريات' : 'Battery Bank'}</text>
  
  <!-- AC Breaker -->
  <rect x="400" y="200" width="140" height="40" fill="#DBEAFE" stroke="#3B82F6" stroke-width="2" rx="8"/>
  <text x="470" y="225" text-anchor="middle" fill="#1E40AF" font-size="10">${isAr ? 'قاطع AC رئيسي' : 'Main AC Breaker'}</text>
  
  <!-- Transfer Switch -->
  <rect x="400" y="290" width="140" height="40" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2" rx="8"/>
  <text x="470" y="315" text-anchor="middle" fill="#92400E" font-size="10">${isAr ? 'مفتاح تحويل تلقائي' : 'Auto Transfer Switch'}</text>
  
  <!-- Grid -->
  <rect x="600" y="290" width="130" height="50" fill="#D1FAE5" stroke="#10B981" stroke-width="2" rx="8"/>
  <text x="665" y="320" text-anchor="middle" fill="#065F46" font-size="11" font-weight="bold">🏢</text>
  <text x="665" y="335" text-anchor="middle" fill="#065F46" font-size="9">${isAr ? 'شبكة الكهرباء' : 'Utility Grid'}</text>
  
  <!-- Load -->
  <rect x="400" y="390" width="140" height="70" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2" rx="8"/>
  <text x="470" y="425" text-anchor="middle" fill="#92400E" font-size="11" font-weight="bold">🏠</text>
  <text x="470" y="445" text-anchor="middle" fill="#92400E" font-size="10">${isAr ? 'الأحمال الكهربائية' : 'Electrical Loads'}</text>
  
  <!-- Grounding -->
  <rect x="50" y="490" width="700" height="40" fill="${isAr ? '#2d2d44' : '#F1F5F9'}" stroke="#64748B" stroke-width="1" rx="6" stroke-dasharray="5,5"/>
  <text x="400" y="515" text-anchor="middle" fill="#64748B" font-size="11">⏚ ${isAr ? 'نظام التأريض والحماية من الصواعق' : 'Grounding & Lightning Protection System'}</text>
  
  <!-- Arrows -->
  <line x1="170" y1="105" x2="228" y2="105" stroke="#F59E0B" stroke-width="2" marker-end="url(#arrowhead3)"/>
  <line x1="330" y1="105" x2="398" y2="105" stroke="#F59E0B" stroke-width="2" marker-end="url(#arrowhead3)"/>
  <line x1="110" y1="250" x2="110" y2="200" stroke="#8B5CF6" stroke-width="2" marker-end="url(#arrowhead3)"/>
  <line x1="110" y1="200" x2="400" y2="130" stroke="#8B5CF6" stroke-width="2" marker-end="url(#arrowhead3)" stroke-dasharray="5,3"/>
  <line x1="470" y1="145" x2="470" y2="198" stroke="#F59E0B" stroke-width="2" marker-end="url(#arrowhead3)"/>
  <line x1="470" y1="240" x2="470" y2="288" stroke="#F59E0B" stroke-width="2" marker-end="url(#arrowhead3)"/>
  <line x1="540" y1="310" x2="598" y2="310" stroke="#10B981" stroke-width="2" marker-end="url(#arrowhead3)"/>
  <line x1="470" y1="330" x2="470" y2="388" stroke="#EF4444" stroke-width="2" marker-end="url(#arrowhead3)"/>
</svg>`,
      };
  }
}

// ============= RECOMMENDATIONS BASED ON CALCULATION RESULTS =============
export function getSystemRecommendations(
  results: {
    totalPeakLoad: number;
    totalDailyConsumptionKWh: number;
    numberOfPanels: number;
    actualTotalBatteries: number;
    recommendedInverter: number;
    systemType: 'on-grid' | 'off-grid' | 'hybrid';
    batteryType: string;
    totalCost: number;
    panelArea: number;
  },
  language: 'ar' | 'en'
): { title: string; items: string[] }[] {
  const isAr = language === 'ar';
  const recommendations: { title: string; items: string[] }[] = [];

  // Panel recommendations
  const panelRecs: string[] = [];
  if (results.numberOfPanels > 20) {
    panelRecs.push(isAr
      ? 'نظراً لعدد الألواح الكبير، يُنصح بتقسيمها إلى مجموعات مع صندوق تجميع DC مركزي'
      : 'Due to the large number of panels, divide them into groups with a central DC combiner box');
  }
  if (results.panelArea > 50) {
    panelRecs.push(isAr
      ? `المساحة المطلوبة ${results.panelArea.toFixed(0)} م² - تأكد من توفر مساحة كافية على السطح مع مراعاة فتحات التهوية`
      : `Required area ${results.panelArea.toFixed(0)} m² - ensure sufficient roof space with ventilation gaps`);
  }
  panelRecs.push(isAr
    ? 'استخدم ألواح من نفس النوع والاستطاعة في كل سلسلة لضمان أداء متوازن'
    : 'Use panels of the same type and wattage in each string for balanced performance');
  panelRecs.push(isAr
    ? 'تأكد من أن هيكل التركيب يتحمل وزن الألواح (حوالي 12-15 كجم/لوح)'
    : 'Ensure the mounting structure can support panel weight (approximately 12-15 kg/panel)');
  recommendations.push({
    title: isAr ? '💡 توصيات الألواح الشمسية' : '💡 Solar Panel Recommendations',
    items: panelRecs,
  });

  // Battery recommendations
  if (results.systemType !== 'on-grid') {
    const battRecs: string[] = [];
    if (results.actualTotalBatteries > 8) {
      battRecs.push(isAr
        ? 'عدد البطاريات كبير - يُنصح باستخدام بطاريات ليثيوم بسعة أعلى لتقليل العدد وتحسين الأداء'
        : 'Large battery count - consider higher-capacity lithium batteries to reduce count and improve performance');
    }
    if (results.batteryType === 'lead-acid') {
      battRecs.push(isAr
        ? 'بطاريات حمض الرصاص تحتاج صيانة دورية (فحص المحلول، تنظيف الأقطاب) كل شهر'
        : 'Lead-acid batteries require monthly maintenance (electrolyte check, terminal cleaning)');
    } else {
      battRecs.push(isAr
        ? 'بطاريات الليثيوم لا تحتاج صيانة - تأكد فقط من عمل نظام BMS بشكل صحيح'
        : 'Lithium batteries are maintenance-free - just ensure the BMS system works correctly');
    }
    battRecs.push(isAr
      ? 'حافظ على درجة حرارة البطاريات بين 20-25°م لتحقيق أقصى عمر افتراضي'
      : 'Keep battery temperature between 20-25°C for maximum lifespan');
    recommendations.push({
      title: isAr ? '🔋 توصيات البطاريات' : '🔋 Battery Recommendations',
      items: battRecs,
    });
  }

  // Inverter recommendations
  const invRecs: string[] = [];
  if (results.systemType === 'hybrid') {
    invRecs.push(isAr
      ? 'العاكس الهجين يتيح التبديل التلقائي بين الشبكة والبطاريات - برمج أولويات الطاقة حسب احتياجك'
      : 'The hybrid inverter allows automatic switching between grid and batteries - program energy priorities as needed');
  }
  if (results.recommendedInverter >= 10000) {
    invRecs.push(isAr
      ? 'العاكس كبير (≥10 كيلوواط) - تأكد من وجود نظام تبريد كافٍ ومساحة تهوية مناسبة'
      : 'Large inverter (≥10 kW) - ensure adequate cooling system and ventilation space');
  }
  invRecs.push(isAr
    ? 'اختر عاكساً بتصنيف كفاءة لا يقل عن 95% لتقليل الفاقد'
    : 'Choose an inverter with efficiency rating of at least 95% to minimize losses');
  recommendations.push({
    title: isAr ? '⚡ توصيات العاكس' : '⚡ Inverter Recommendations',
    items: invRecs,
  });

  // Safety recommendations
  const safetyRecs: string[] = [
    isAr
      ? 'ركّب مانع صواعق (SPD) على كل من جانبي DC وAC لحماية النظام'
      : 'Install Surge Protection Device (SPD) on both DC and AC sides',
    isAr
      ? 'تأكد من أن جميع التوصيلات محكمة ومقاومة للماء (IP65 على الأقل في الخارج)'
      : 'Ensure all connections are sealed and waterproof (IP65 minimum outdoors)',
    isAr
      ? 'ضع ملصقات تحذيرية واضحة على جميع المعدات الكهربائية'
      : 'Place clear warning labels on all electrical equipment',
  ];
  recommendations.push({
    title: isAr ? '🛡️ توصيات السلامة' : '🛡️ Safety Recommendations',
    items: safetyRecs,
  });

  return recommendations;
}
