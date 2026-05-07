const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    const fullPath = path.resolve(filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    replacements.forEach(({ search, replace }) => {
        content = content.replace(search, replace);
    });
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Updated', filePath);
}

// 1. Profile Page
replaceInFile('front/app/profile/page.tsx', [
    {
        search: /className="relative overflow-hidden rounded-3xl border border-white\/60 bg-white\/80 p-6 shadow-\[0_25px_80px_rgba\(15,23,42,0\.08\)\] backdrop-blur"/g,
        replace: 'className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:bg-slate-900/80 dark:border-white/10 dark:shadow-none"'
    }
]);

// 2. Admin Page
replaceInFile('front/app/admin/page.tsx', [
    {
        search: /className="mt-10 panel border-slate-200 bg-white\/85 backdrop-blur-sm p-6 md:p-8 shadow-\[0_24px_70px_rgba\(15,23,42,0\.08\)\]"/g,
        replace: 'className="mt-10 panel border-slate-200 bg-white/85 backdrop-blur-sm p-6 md:p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:bg-slate-900/80 dark:border-white/10 dark:shadow-none"'
    },
    {
        search: /className="rounded-2xl border border-slate-200 bg-slate-50\/60 p-4"/g,
        replace: 'className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:bg-slate-800/60 dark:border-white/10"'
    }
]);

// 3. Admin Users Page
replaceInFile('front/app/admin/users/page.tsx', [
    {
        search: /className="mt-6 overflow-hidden rounded-2xl border border-sky-100\/80 bg-gradient-to-br from-white via-sky-50\/70 to-emerald-50\/50 shadow-sm"/g,
        replace: 'className="mt-6 overflow-hidden rounded-2xl border border-sky-100/80 bg-gradient-to-br from-white via-sky-50/70 to-emerald-50/50 shadow-sm dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:border-white/10"'
    },
    {
        search: /className="bg-gradient-to-r from-sky-100\/80 via-indigo-50\/80 to-emerald-100\/70 text-xs uppercase text-ink\/70"/g,
        replace: 'className="bg-gradient-to-r from-sky-100/80 via-indigo-50/80 to-emerald-100/70 text-xs uppercase text-ink/70 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 dark:text-slate-300"'
    },
    {
        search: /className={`\$\{index % 2 === 0 \? 'bg-white\/80' : 'bg-sky-50\/70'\} transition-colors hover:bg-emerald-50\/60`}/g,
        replace: 'className={`${index % 2 === 0 ? \'bg-white/80 dark:bg-slate-900\' : \'bg-sky-50/70 dark:bg-slate-800/50\'} transition-colors hover:bg-emerald-50/60 dark:hover:bg-slate-700/50`}'
    },
    {
        search: /className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary\/30"/g,
        replace: 'className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"'
    }
]);
