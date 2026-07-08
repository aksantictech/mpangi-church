const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, 'src', 'app');
const OUT_MD = path.join(ROOT, 'SECURITY_ROUTE_AUDIT_REPORT.md');
const OUT_JSON = path.join(ROOT, 'security-route-audit-report.json');

const PROTECTED_PATTERNS = [
  ['super-admin', 'super_admin', 'requireSuperAdmin', null],
  ['settings/users', 'church_admin', 'requireChurchAdmin', null],
  ['settings', 'church_module', 'requireChurchModuleAccess', 'settings'],
  ['dashboard', 'church_module', 'requireChurchModuleAccess', 'dashboard'],
  ['notifications', 'church_module', 'requireChurchModuleAccess', 'notifications'],
  ['members', 'church_module', 'requireChurchModuleAccess', 'members'],
  ['attendance', 'church_module', 'requireChurchModuleAccess', 'attendance'],
  ['souls', 'church_module', 'requireChurchModuleAccess', 'souls'],
  ['departments', 'church_module', 'requireChurchModuleAccess', 'departments'],
  ['events', 'church_module', 'requireChurchModuleAccess', 'events'],
  ['publications', 'church_module', 'requireChurchModuleAccess', 'publications'],
  ['teachings', 'church_module', 'requireChurchModuleAccess', 'teachings'],
  ['appointments', 'church_module', 'requireChurchModuleAccess', 'appointments'],
  ['testimonies', 'church_module', 'requireChurchModuleAccess', 'testimonies'],
  ['public-requests', 'church_module', 'requireChurchModuleAccess', 'public_requests'],
  ['administration/correspondence', 'church_module', 'requireChurchModuleAccess', 'correspondence'],
  ['administration/inbox', 'church_module', 'requireChurchModuleAccess', 'document_transmissions'],
  ['administration/transmissions', 'church_module', 'requireChurchModuleAccess', 'document_transmissions'],
  ['administration/tasks', 'church_module', 'requireChurchModuleAccess', 'administrative_tasks'],
  ['administration/minutes', 'church_module', 'requireChurchModuleAccess', 'meetings_minutes'],
  ['finance/offerings', 'church_module', 'requireChurchModuleAccess', 'offerings'],
  ['finance/expenses', 'church_module', 'requireChurchModuleAccess', 'expenses'],
  ['finance/budgets', 'church_module', 'requireChurchModuleAccess', 'budgets'],
  ['finance/reports', 'church_module', 'requireChurchModuleAccess', 'financial_reports'],
  ['finance', 'church_module', 'requireChurchModuleAccess', 'finance_dashboard'],
  ['patrimony/assets', 'church_module', 'requireChurchModuleAccess', 'assets'],
  ['patrimony/maintenance', 'church_module', 'requireChurchModuleAccess', 'asset_maintenance'],
  ['patrimony/movements', 'church_module', 'requireChurchModuleAccess', 'asset_movements'],
  ['patrimony', 'church_module', 'requireChurchModuleAccess', 'patrimony_dashboard'],
].map(([prefix, type, helper, module]) => ({ prefix, type, helper, module }));

const PUBLIC_PREFIXES = new Set(['api', 'church', 'login', 'logout', 'install', 'unauthorized', 'manifest', 'favicon', '_not-found']);
const FILE_NAMES = new Set(['page.tsx', 'route.ts', 'actions.ts']);

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, results);
    else if (FILE_NAMES.has(entry.name)) results.push(full);
  }
  return results;
}

function routeKeyForFile(filePath) {
  return path.relative(APP_DIR, filePath).replaceAll('\\', '/')
    .replace(/\/page\.tsx$/, '')
    .replace(/\/route\.ts$/, '')
    .replace(/\/actions\.ts$/, '')
    .replace(/^\(.*?\)\//, '');
}

function isPublicRoute(routeKey) {
  if (!routeKey) return true;
  const first = routeKey.split('/')[0];
  return PUBLIC_PREFIXES.has(first) || routeKey.includes('/public/');
}

function expectedPolicy(routeKey) {
  const sorted = [...PROTECTED_PATTERNS].sort((a, b) => b.prefix.length - a.prefix.length);
  return sorted.find((p) => routeKey === p.prefix || routeKey.startsWith(`${p.prefix}/`));
}

function sourceHasProtection(source, policy) {
  if (!policy) return false;
  if (policy.type === 'super_admin') return source.includes('requireSuperAdmin(');
  if (policy.type === 'church_admin') return source.includes('requireChurchAdmin(') || source.includes('requireSameChurchProfile(');
  if (policy.type === 'church_module') {
    if (!source.includes('requireChurchModuleAccess(')) return false;
    if (!policy.module) return true;
    return source.includes(`requireChurchModuleAccess("${policy.module}"`) || source.includes(`requireChurchModuleAccess('${policy.module}'`);
  }
  return false;
}

function actionLevel(source) {
  return {
    canCreate: source.includes('"can_create"') || source.includes("'can_create'"),
    canUpdate: source.includes('"can_update"') || source.includes("'can_update'"),
    canDelete: source.includes('"can_delete"') || source.includes("'can_delete'"),
    canExport: source.includes('"can_export"') || source.includes("'can_export'"),
    canApprove: source.includes('"can_approve"') || source.includes("'can_approve'"),
  };
}

const rows = walk(APP_DIR).map((filePath) => {
  const routeKey = routeKeyForFile(filePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const policy = expectedPolicy(routeKey);
  const publicRoute = isPublicRoute(routeKey);
  const protected = policy ? sourceHasProtection(source, policy) : publicRoute;
  return {
    file: path.relative(ROOT, filePath).replaceAll('\\', '/'),
    route: `/${routeKey}`,
    fileType: path.basename(filePath),
    publicRoute,
    expectedType: policy?.type || (publicRoute ? 'public' : 'unknown'),
    expectedHelper: policy?.helper || null,
    expectedModule: policy?.module || null,
    protected,
    importedAdminClient: source.includes('createAdminClient'),
    importedServiceHelperInClient: source.includes('"use client"') && source.includes('createAdminClient'),
    actionLevel: actionLevel(source),
  };
});

const risky = rows.filter((r) => !r.publicRoute && !r.protected);
const clientLeaks = rows.filter((r) => r.importedServiceHelperInClient);

const md = [
  '# Mpangi-church — Audit sécurité des routes',
  '',
  `Date: ${new Date().toISOString()}`,
  '',
  '## Résumé',
  '',
  `- Fichiers analysés: ${rows.length}`,
  `- Routes à vérifier: ${risky.length}`,
  `- Imports createAdminClient dans fichiers client: ${clientLeaks.length}`,
  '',
  '## Routes à corriger en priorité',
  '',
  risky.length === 0 ? 'Aucune route critique détectée sans protection selon la cartographie actuelle.' : [
    '| Fichier | Route | Protection attendue | Module attendu |',
    '|---|---|---|---|',
    ...risky.map((r) => `| \`${r.file}\` | \`${r.route}\` | \`${r.expectedHelper || 'à définir'}\` | \`${r.expectedModule || '-'}\` |`),
  ].join('\n'),
  '',
  '## Risques service role côté client',
  '',
  clientLeaks.length === 0 ? 'Aucun import `createAdminClient` détecté dans un fichier `use client`.' : clientLeaks.map((r) => `- \`${r.file}\``).join('\n'),
  '',
  '## Détail complet',
  '',
  '| Statut | Fichier | Route | Type | Helper | Module |',
  '|---|---|---|---|---|---|',
  ...rows.map((r) => {
    const status = r.publicRoute ? 'PUBLIC' : r.protected ? 'OK' : 'À CORRIGER';
    return `| ${status} | \`${r.file}\` | \`${r.route}\` | ${r.expectedType} | \`${r.expectedHelper || '-'}\` | \`${r.expectedModule || '-'}\` |`;
  }),
  '',
  '## Exemples de correction',
  '',
  '```ts',
  'import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";',
  '',
  'await requireChurchModuleAccess("expenses");',
  'await requireChurchModuleAccess("expenses", "can_create");',
  '```',
  '',
].join('\n');

fs.writeFileSync(OUT_MD, md, 'utf8');
fs.writeFileSync(OUT_JSON, JSON.stringify(rows, null, 2), 'utf8');

console.log('Audit terminé.');
console.log(`Rapport Markdown : ${path.relative(ROOT, OUT_MD)}`);
console.log(`Rapport JSON     : ${path.relative(ROOT, OUT_JSON)}`);
console.log(`Routes à vérifier : ${risky.length}`);
console.log(`Risques service role client : ${clientLeaks.length}`);
if (risky.length) {
  console.log('Top routes à corriger :');
  for (const row of risky.slice(0, 20)) console.log(`- ${row.file} -> ${row.expectedHelper || 'à définir'} ${row.expectedModule || ''}`);
}
