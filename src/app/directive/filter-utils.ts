export function normalizeDateFilters(filters: any): any {
    if (!filters || typeof filters !== 'object') return filters;
  
    const normalizedFilters = { ...filters };
  
    for (const key in normalizedFilters) {
      if (
        normalizedFilters[key] &&
        typeof normalizedFilters[key] === 'object' &&
        'startDate' in normalizedFilters[key] &&
        'endDate' in normalizedFilters[key]
      ) {
        if (normalizedFilters[key].startDate === null && normalizedFilters[key].endDate === null) {
          normalizedFilters[key] = null;
        }
      }
    }
  
    return normalizedFilters;
  }
  