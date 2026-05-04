import type { Mosque, AppConfig } from '../types';

export class GoogleSheetsService {
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
  }

  async fetchMosques(): Promise<Mosque[]> {
    if (!this.config.spreadsheetId) {
      return [];
    }

    try {
      // Use CSV export URL - works for any publicly shared Google Sheet
      // No API key needed!
      const url = `https://docs.google.com/spreadsheets/d/${this.config.spreadsheetId}/export?format=csv&gid=0`;

      const response = await fetch(url);

      if (response.status === 403 || response.status === 401) {
        throw new Error('الجدول غير متاح للعموم. يرجى تغيير صلاحيات المشاركة إلى "أي شخص لديه الرابط يمكنه العرض"');
      }
      if (!response.ok) {
        throw new Error(`فشل في تحميل البيانات (HTTP ${response.status})`);
      }

      const csvText = await response.text();
      return this.parseCSV(csvText);
    } catch (error) {
      console.error('Fetch Error:', error);
      throw error;
    }
  }

  private parseCSV(csvText: string): Mosque[] {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
    
    const mosques: Mosque[] = [];
    let currentRegion = 'غير محدد';
    
    // Known region names
    const regionNames = ['الشارقة', 'المنطقة الوسطى', 'المنطقة الشرقية'];

    // Parse CSV row respecting quoted fields
    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += line[i];
        }
      }
      result.push(current.trim());
      return result;
    };

    // Skip header row (row 0)
    for (let i = 1; i < lines.length; i++) {
      const row = parseRow(lines[i]);
      
      // Check if this row is a region header
      // Region rows have the region name in the first non-empty cell and rest are empty
      const firstCell = (row[0] || '').trim();
      const restEmpty = row.slice(1).every(c => !c || c.trim() === '');
      
      const isRegionRow = regionNames.some(r => firstCell.includes(r)) || 
                          (restEmpty && firstCell !== '' && !firstCell.match(/^\d/));
      
      if (isRegionRow) {
        // Find which region it is
        for (const region of regionNames) {
          if (firstCell.includes(region)) {
            currentRegion = region;
            break;
          }
        }
        if (restEmpty) currentRegion = firstCell || currentRegion;
        continue;
      }

      // Map columns based on the actual sheet structure seen in screenshot:
      // A(0)=المهندس المسؤول  B(1)=الأعمال الجارية في الموقع
      // C(2)=? D(3)=? E(4)=تاريخ التوقع للافتتاح F(5)=سعة الرجال
      // G(6)=سعة النساء H(7)=إجمالي المصلين I(8)=المتبرع/الواهب
      // J(9)=المقاول K(10)=الاستشاري L(11)=المنطقة M(12)=رقم القطعة N(13)=م
      
      const plotNumber = (row[12] || '').trim();
      if (!plotNumber || plotNumber === '' || plotNumber === 'رقم القطعة') continue;

      const menCap = parseInt(row[5]) || 0;
      const womenCap = parseInt(row[6]) || 0;

      mosques.push({
        id: (i + 1).toString(),
        plotNumber,
        area: (row[11] || '').trim(),
        region: currentRegion,
        consultant: (row[10] || '').trim(),
        contractor: (row[9] || '').trim(),
        donor: (row[8] || '').trim(),
        menCapacity: menCap,
        womenCapacity: womenCap,
        totalCapacity: parseInt(row[7]) || (menCap + womenCap),
        expectedOpeningDate: (row[4] || '').trim(),
        currentWorks: (row[1] || '').trim(),
        visitDate: '',
        completionPercentage: 0,
        responsibleEngineer: (row[0] || '').trim(),
        status: 'in_progress',
      });
    }

    return mosques;
  }

  async testConnection(): Promise<{ success: boolean; count: number }> {
    const mosques = await this.fetchMosques();
    return { success: true, count: mosques.length };
  }

  async updateMosque(_mosque: Mosque): Promise<boolean> {
    console.warn('Write operations require OAuth - not yet implemented');
    return false;
  }

  async addMosque(_mosque: Omit<Mosque, 'id'>): Promise<boolean> {
    console.warn('Write operations require OAuth - not yet implemented');
    return false;
  }

  async deleteMosque(_id: string): Promise<boolean> {
    console.warn('Write operations require OAuth - not yet implemented');
    return false;
  }
}
