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

replaceInFile('front/app/orders/[id]/page.tsx', [
    {
        search: /bg-yellow-100 text-yellow-800/g,
        replace: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    },
    {
        search: /bg-blue-100 text-blue-800/g,
        replace: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    },
    {
        search: /bg-purple-100 text-purple-800/g,
        replace: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    },
    {
        search: /bg-green-100 text-green-800/g,
        replace: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    },
    {
        search: /bg-red-100 text-red-800/g,
        replace: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    },
    {
        search: /className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4"/g,
        replace: 'className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:bg-red-900/20 dark:border-red-500/20"'
    },
    {
        search: /className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-sand bg-white p-4"/g,
        replace: 'className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-sand bg-white p-4 dark:bg-slate-800 dark:border-white/10"'
    },
    {
        search: /className="rounded-2xl bg-sand\/30 p-6 text-right md:min-w-\[300px\]"/g,
        replace: 'className="rounded-2xl bg-sand/30 p-6 text-right md:min-w-[300px] dark:bg-slate-800"'
    },
    {
        search: /className="inline-flex items-center justify-center rounded-full bg-sky-50 px-3 py-1 text-\[10px\] font-bold uppercase tracking-wider text-sky-600 transition hover:bg-sky-100 hover:scale-105 active:scale-95 border border-sky-100"/g,
        replace: 'className="inline-flex items-center justify-center rounded-full bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-600 transition hover:bg-sky-100 hover:scale-105 active:scale-95 border border-sky-100 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-500/20 dark:hover:bg-sky-900/50"'
    }
]);

replaceInFile('front/app/orders/page.tsx', [
    {
        search: /bg-yellow-100 text-yellow-800/g,
        replace: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    },
    {
        search: /bg-blue-100 text-blue-800/g,
        replace: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    },
    {
        search: /bg-purple-100 text-purple-800/g,
        replace: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    },
    {
        search: /bg-green-100 text-green-800/g,
        replace: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    },
    {
        search: /bg-red-100 text-red-800/g,
        replace: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    },
    {
        search: /className="rounded-xl border border-black\/10 p-4 relative overflow-hidden"/g,
        replace: 'className="rounded-xl border border-black/10 p-4 relative overflow-hidden dark:bg-slate-800/60 dark:border-white/10"'
    },
    {
        search: /className="flex h-8 items-center justify-center rounded-md bg-red-50 px-4 text-xs font-medium text-red-600 shadow-sm transition-colors hover:bg-red-100"/g,
        replace: 'className="flex h-8 items-center justify-center rounded-md bg-red-50 px-4 text-xs font-medium text-red-600 shadow-sm transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"'
    },
    {
        search: /className="mt-2 rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"/g,
        replace: 'className="mt-2 rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-400"'
    },
    {
        search: /className="text-\[10px\] bg-sand px-1.5 py-0.5 rounded ml-1"/g,
        replace: 'className="text-[10px] bg-sand px-1.5 py-0.5 rounded ml-1 dark:bg-slate-700 dark:text-slate-300"'
    },
    {
        search: /className="mx-auto w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-6"/g,
        replace: 'className="mx-auto w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-6 dark:bg-red-900/30 dark:text-red-400"'
    },
    {
        search: /className="w-full max-w-sm overflow-hidden rounded-\[3rem\] bg-white border border-white\/60 shadow-\[0_45px_110px_rgba\(0,0,0,0\.35\)\] animate-in zoom-in-95 duration-300"/g,
        replace: 'className="w-full max-w-sm overflow-hidden rounded-[3rem] bg-white border border-white/60 shadow-[0_45px_110px_rgba(0,0,0,0.35)] animate-in zoom-in-95 duration-300 dark:bg-slate-900 dark:border-white/10"'
    },
    {
        search: /className="w-full py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold transition hover:bg-slate-200"/g,
        replace: 'className="w-full py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"'
    }
]);
