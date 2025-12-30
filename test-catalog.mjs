import { CATALOG_PARTS, CATALOG_CATEGORIES } from './lib/catalog-data.ts';
import { generateAllParts } from './lib/generate-catalog-parts.ts';

console.log('✓ Catalog Categories:', CATALOG_CATEGORIES.length);
console.log('✓ Structural Profiles (hard-coded):', CATALOG_PARTS.filter(p => p.id.startsWith('shs-')).length + CATALOG_PARTS.filter(p => p.id.startsWith('rhs-')).length);
console.log('✓ Generated Parts:', generateAllParts().length);
console.log('✓ Total Parts in Catalog:', CATALOG_PARTS.length + generateAllParts().length);

// Check category breakdown
const categoryCounts = {};
CATALOG_PARTS.forEach(p => {
  categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
});
generateAllParts().forEach(p => {
  categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
});

console.log('\nCategory Breakdown:');
Object.entries(categoryCounts).forEach(([cat, count]) => {
  const catData = CATALOG_CATEGORIES.find(c => c.id === cat);
  console.log(`  ${catData?.icon || '?'} ${catData?.name || cat}: ${count} parts`);
});
