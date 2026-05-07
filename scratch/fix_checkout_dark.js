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

replaceInFile('front/app/checkout/page.tsx', [
    {
        search: /className="rounded-2xl border border-sky-100\/80 bg-white\/80 p-5 shadow-\[0_18px_45px_rgba\(14,116,144,0\.15\)\] space-y-4"/g,
        replace: 'className="rounded-2xl border border-sky-100/80 bg-white/80 dark:bg-slate-800/80 dark:border-white/10 p-5 shadow-[0_18px_45px_rgba(14,116,144,0.15)] space-y-4"'
    },
    {
        search: /className="max-h-56 overflow-auto rounded-xl border border-sky-100 bg-white shadow-sm"/g,
        replace: 'className="max-h-56 overflow-auto rounded-xl border border-sky-100 bg-white dark:bg-slate-800 dark:border-white/10 shadow-sm"'
    },
    {
        search: /className="h-14 w-16 overflow-hidden rounded-xl border border-black\/5 bg-white shadow-sm"/g,
        replace: 'className="h-14 w-16 overflow-hidden rounded-xl border border-black/5 bg-white dark:bg-slate-800 dark:border-white/10 shadow-sm"'
    },
    {
        search: /className="mt-3 overflow-hidden rounded-xl border border-amber-200 bg-white"/g,
        replace: 'className="mt-3 overflow-hidden rounded-xl border border-amber-200 bg-white dark:bg-amber-900/40 dark:border-amber-500/20"'
    },
    {
        search: /className="rounded-\[2rem\] border border-sky-200\/80 bg-white\/90 p-5 shadow-\[0_30px_80px_rgba\(14,116,144,0\.2\)\]"/g,
        replace: 'className="rounded-[2rem] border border-sky-200/80 bg-white/90 dark:bg-slate-900/90 dark:border-white/10 p-5 shadow-[0_30px_80px_rgba(14,116,144,0.2)]"'
    },
    {
        search: /className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink\/15 bg-white px-4 py-2\.5 text-xs font-bold uppercase tracking-wider text-ink\/75 transition hover:bg-ink\/5 disabled:opacity-60"/g,
        replace: 'className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/15 bg-white dark:bg-slate-800 dark:border-slate-700 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ink/75 dark:text-slate-300 transition hover:bg-ink/5 dark:hover:bg-slate-700 disabled:opacity-60"'
    },
    {
        search: /className="w-full max-w-lg overflow-hidden rounded-\[3rem\] bg-white border border-white\/60 shadow-\[0_40px_100px_rgba\(0,0,0,0\.3\)\] animate-in zoom-in-95 duration-300"/g,
        replace: 'className="w-full max-w-lg overflow-hidden rounded-[3rem] bg-white border border-white/60 shadow-[0_40px_100px_rgba(0,0,0,0.3)] dark:bg-slate-900 dark:border-white/10 animate-in zoom-in-95 duration-300"'
    },
    {
        search: /hover:bg-sky-50/g,
        replace: 'hover:bg-sky-50 dark:hover:bg-slate-700/50'
    },
    {
        search: /bg-sky-100\/80/g,
        replace: 'bg-sky-100/80 dark:bg-sky-900/30'
    },
    {
        search: /bg-white\/10/g,
        replace: 'bg-white/10 dark:bg-white/5'
    }
]);
