import { Specimen } from '../../db/schema';

export const csvExportService = {
  generateCsv(specimens: Specimen[]): string {
    const headers = [
      'Specimen ID',
      'Custom Name',
      'Country',
      'Denomination',
      'Year',
      'Ruler / Authority',
      'Mint',
      'Metal',
      'Series',
      'Catalog References',
      'Grade',
      'Grading Service',
      'Acquisition Date',
      'Acquisition Price',
      'Acquisition Currency',
      'Acquisition Source',
      'Seller',
      'Estimated Value Min',
      'Estimated Value Max',
      'Is Favorite',
      'Notes',
    ];

    const escapeCsv = (str: any): string => {
      if (str === null || str === undefined) return '';
      const s = String(str);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows = specimens.map((s) => {
      const ct = s.coin_type;
      const val = s.latest_valuation;
      return [
        escapeCsv(s.id),
        escapeCsv(s.custom_name),
        escapeCsv(ct?.country),
        escapeCsv(ct?.denomination),
        escapeCsv(ct?.year_start),
        escapeCsv(ct?.ruler),
        escapeCsv(ct?.mint),
        escapeCsv(ct?.metal),
        escapeCsv(ct?.coin_series),
        escapeCsv(ct?.catalog_references?.join('; ')),
        escapeCsv(s.user_grade),
        escapeCsv(s.grading_service),
        escapeCsv(s.acquisition_date),
        escapeCsv(s.acquisition_price),
        escapeCsv(s.acquisition_currency),
        escapeCsv(s.acquisition_source),
        escapeCsv(s.seller),
        escapeCsv(val?.estimated_value_min),
        escapeCsv(val?.estimated_value_max),
        escapeCsv(s.is_favorite === 1 ? 'Yes' : 'No'),
        escapeCsv(s.notes),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },
};
