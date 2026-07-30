export const COUNTRIES = [
  // East Asia
  { code: 'JP', name: 'Japan', nameZh: '日本', region: 'East Asia' },
  { code: 'KR', name: 'South Korea', nameZh: '韩国', region: 'East Asia' },
  { code: 'TW', name: 'Taiwan', nameZh: '台湾', region: 'East Asia' },
  { code: 'CN', name: 'China', nameZh: '中国', region: 'East Asia' },
  { code: 'HK', name: 'Hong Kong', nameZh: '香港', region: 'East Asia' },
  
  // Southeast Asia
  { code: 'VN', name: 'Vietnam', nameZh: '越南', region: 'Southeast Asia' },
  { code: 'TH', name: 'Thailand', nameZh: '泰国', region: 'Southeast Asia' },
  { code: 'ID', name: 'Indonesia', nameZh: '印尼', region: 'Southeast Asia' },
  { code: 'MY', name: 'Malaysia', nameZh: '马来西亚', region: 'Southeast Asia' },
  { code: 'PH', name: 'Philippines', nameZh: '菲律宾', region: 'Southeast Asia' },
  { code: 'SG', name: 'Singapore', nameZh: '新加坡', region: 'Southeast Asia' },

  // South Asia
  { code: 'IN', name: 'India', nameZh: '印度', region: 'South Asia' },
  { code: 'BD', name: 'Bangladesh', nameZh: '孟加拉国', region: 'South Asia' },
  { code: 'PK', name: 'Pakistan', nameZh: '巴基斯坦', region: 'South Asia' },
  { code: 'LK', name: 'Sri Lanka', nameZh: '斯里兰卡', region: 'South Asia' },

  // Europe
  { code: 'DE', name: 'Germany', nameZh: '德国', region: 'Europe' },
  { code: 'FR', name: 'France', nameZh: '法国', region: 'Europe' },
  { code: 'GB', name: 'UK', nameZh: '英国', region: 'Europe' },
  { code: 'IT', name: 'Italy', nameZh: '意大利', region: 'Europe' },
  { code: 'ES', name: 'Spain', nameZh: '西班牙', region: 'Europe' },
  { code: 'NL', name: 'Netherlands', nameZh: '荷兰', region: 'Europe' },
  { code: 'SE', name: 'Sweden', nameZh: '瑞典', region: 'Europe' },
  { code: 'PL', name: 'Poland', nameZh: '波兰', region: 'Europe' },
  { code: 'CZ', name: 'Czech Republic', nameZh: '捷克', region: 'Europe' },
  { code: 'CH', name: 'Switzerland', nameZh: '瑞士', region: 'Europe' },
  { code: 'AT', name: 'Austria', nameZh: '奥地利', region: 'Europe' },
  { code: 'BE', name: 'Belgium', nameZh: '比利时', region: 'Europe' },
  { code: 'DK', name: 'Denmark', nameZh: '丹麦', region: 'Europe' },
  { code: 'NO', name: 'Norway', nameZh: '挪威', region: 'Europe' },
  { code: 'FI', name: 'Finland', nameZh: '芬兰', region: 'Europe' },

  // Americas
  { code: 'US', name: 'USA', nameZh: '美国', region: 'Americas' },
  { code: 'CA', name: 'Canada', nameZh: '加拿大', region: 'Americas' },
  { code: 'MX', name: 'Mexico', nameZh: '墨西哥', region: 'Americas' },
  { code: 'BR', name: 'Brazil', nameZh: '巴西', region: 'Americas' },
  { code: 'AR', name: 'Argentina', nameZh: '阿根廷', region: 'Americas' },
  { code: 'CO', name: 'Colombia', nameZh: '哥伦比亚', region: 'Americas' },
  { code: 'CL', name: 'Chile', nameZh: '智利', region: 'Americas' },

  // Middle East
  { code: 'AE', name: 'UAE', nameZh: '阿联酋', region: 'Middle East' },
  { code: 'SA', name: 'Saudi Arabia', nameZh: '沙特阿拉伯', region: 'Middle East' },
  { code: 'TR', name: 'Turkey', nameZh: '土耳其', region: 'Middle East' },
  { code: 'IL', name: 'Israel', nameZh: '以色列', region: 'Middle East' },

  // Oceania
  { code: 'AU', name: 'Australia', nameZh: '澳大利亚', region: 'Oceania' },
  { code: 'NZ', name: 'New Zealand', nameZh: '新西兰', region: 'Oceania' }
];

export const INDUSTRIES = [
  { id: 'food_beverage', name: 'Food & Beverage', nameZh: '食品饮料' },
  { id: 'food_packaging', name: 'Food Packaging', nameZh: '食品包装' },
  { id: 'agriculture', name: 'Agriculture', nameZh: '农业' },
  { id: 'semiconductor', name: 'Semiconductor', nameZh: '半导体' },
  { id: 'electronics', name: 'Electronics', nameZh: '电子' },
  { id: 'pcb', name: 'PCB', nameZh: '印刷电路板' },
  { id: 'led', name: 'LED', nameZh: 'LED' },
  { id: 'automotive', name: 'Automotive', nameZh: '汽车' },
  { id: 'auto_parts', name: 'Auto Parts', nameZh: '汽车配件' },
  { id: 'machinery', name: 'Machinery', nameZh: '机械' },
  { id: 'pharmaceutical', name: 'Pharmaceutical', nameZh: '制药' },
  { id: 'medical_device', name: 'Medical Device', nameZh: '医疗器械' },
  { id: 'biotechnology', name: 'Biotechnology', nameZh: '生物技术' },
  { id: 'textile', name: 'Textile', nameZh: '纺织' },
  { id: 'fashion', name: 'Fashion', nameZh: '时尚' },
  { id: 'leather', name: 'Leather', nameZh: '皮革' },
  { id: 'chemical', name: 'Chemical', nameZh: '化工' },
  { id: 'plastics', name: 'Plastics', nameZh: '塑料' },
  { id: 'rubber', name: 'Rubber', nameZh: '橡胶' },
  { id: 'construction', name: 'Construction', nameZh: '建筑' },
  { id: 'building_materials', name: 'Building Materials', nameZh: '建材' },
  { id: 'it', name: 'IT', nameZh: '信息技术' },
  { id: 'software', name: 'Software', nameZh: '软件' },
  { id: 'cloud_services', name: 'Cloud Services', nameZh: '云服务' },
  { id: 'renewable_energy', name: 'Renewable Energy', nameZh: '可再生能源' },
  { id: 'solar', name: 'Solar', nameZh: '太阳能' },
  { id: 'wind', name: 'Wind', nameZh: '风能' },
  { id: 'logistics', name: 'Logistics', nameZh: '物流' },
  { id: 'shipping', name: 'Shipping', nameZh: '航运' },
  { id: 'warehousing', name: 'Warehousing', nameZh: '仓储' }
];

export const COMPANY_TYPES = [
  { id: 'manufacturer', name: 'manufacturer', nameZh: '制造商' },
  { id: 'distributor', name: 'distributor', nameZh: '经销商' },
  { id: 'agent', name: 'agent', nameZh: '代理商' },
  { id: 'importer', name: 'importer', nameZh: '进口商' },
  { id: 'wholesaler', name: 'wholesaler', nameZh: '批发商' },
  { id: 'retailer', name: 'retailer', nameZh: '零售商' },
  { id: 'service_provider', name: 'service_provider', nameZh: '服务提供商' }
];

export function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function generateCompanyName(country: string, industry: string): { name: string; localName?: string } {
  const prefix = industry.split(' ')[0];
  const ctry = COUNTRIES.find(c => c.name === country || c.code === country);
  const region = ctry?.region || 'Europe';
  const cName = ctry?.name || country;

  if (region === 'East Asia' && cName === 'Japan') {
    return { name: `Japan ${prefix} Co., Ltd.`, localName: `日本${prefix}株式会社` };
  } else if (region === 'East Asia' && cName === 'China') {
    return { name: `China ${prefix} Co., Ltd.`, localName: `中国${prefix}有限公司` };
  } else if (region === 'East Asia' && cName === 'South Korea') {
    return { name: `Korea ${prefix} Co., Ltd.`, localName: `한국 ${prefix} 주식회사` };
  } else if (region === 'Europe' && cName === 'Germany') {
    return { name: `${prefix} Germany GmbH`, localName: `${prefix} Deutschland GmbH` };
  } else if (region === 'Americas' && cName === 'USA') {
    const suffix = randomFromArray(['Inc.', 'LLC', 'Corp.']);
    return { name: `American ${prefix} ${suffix}` };
  } else if (region === 'Southeast Asia') {
    return { name: `Asia ${prefix} Trading Co.` };
  }
  
  return { name: `Global ${prefix} ${cName} Ltd.` };
}

export function generateMockEmail(companyName: string): string {
  const domain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `info@${domain}.com`;
}

export function generateMockWebsite(companyName: string): string {
  const domain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `https://www.${domain}.com`;
}

export function generateMockPhone(country: string): string {
  const countryCodes: Record<string, string> = {
    'Japan': '+81',
    'USA': '+1',
    'Germany': '+49',
    'China': '+86',
    'UK': '+44'
  };
  const code = countryCodes[country] || '+00';
  const num = randomBetween(100000000, 999999999);
  return `${code} ${num}`;
}

export function generateMockDescription(industry: string, companyType: string): string {
  return `A leading ${companyType} in the ${industry} sector, providing high quality products and services worldwide.`;
}

export function generateCity(country: string): string {
  const cities: Record<string, string[]> = {
    'Japan': ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya'],
    'USA': ['New York', 'Los Angeles', 'Chicago', 'Houston'],
    'Germany': ['Berlin', 'Munich', 'Frankfurt', 'Hamburg'],
    'China': ['Shanghai', 'Beijing', 'Shenzhen', 'Guangzhou']
  };
  const list = cities[country] || ['Capital City', 'Metropolis'];
  return randomFromArray(list);
}
