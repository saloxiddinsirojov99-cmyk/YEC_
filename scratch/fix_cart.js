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

replaceInFile('front/app/cart/page.tsx', [
    {
        search: /className={`group relative overflow-hidden rounded-2xl border bg-white\/50 p-3 sm:p-5 transition-all duration-300 hover:border-primary\/20 hover:bg-white hover:shadow-xl \$\{/g,
        replace: 'className={`group relative overflow-hidden rounded-2xl border bg-white/50 dark:bg-slate-800/50 p-3 sm:p-5 transition-all duration-300 hover:border-primary/20 hover:bg-white dark:hover:bg-slate-700/80 hover:shadow-xl dark:border-white/10 ${'
    },
    {
        search: /className="rounded-md border border-ink\/10 bg-white\/70 px-2 py-1.5 sm:rounded-lg sm:px-3 sm:py-2"/g,
        replace: 'className="rounded-md border border-ink/10 bg-white/70 dark:bg-slate-800/80 dark:border-white/10 px-2 py-1.5 sm:rounded-lg sm:px-3 sm:py-2"'
    },
    {
        search: /className="rounded-md border border-ink\/10 bg-white\/70 px-2 py-1.5 sm:col-span-2 sm:rounded-lg sm:px-3 sm:py-2 lg:col-span-1"/g,
        replace: 'className="rounded-md border border-ink/10 bg-white/70 dark:bg-slate-800/80 dark:border-white/10 px-2 py-1.5 sm:col-span-2 sm:rounded-lg sm:px-3 sm:py-2 lg:col-span-1"'
    },
    {
        search: /className="flex shrink-0 items-center gap-1 rounded-xl bg-ink\/5 p-1 self-start sm:self-auto"/g,
        replace: 'className="flex shrink-0 items-center gap-1 rounded-xl bg-ink/5 dark:bg-slate-800/60 p-1 self-start sm:self-auto"'
    },
    {
        search: /className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white hover:text-primary disabled:opacity-30 sm:h-8 sm:w-8"/g,
        replace: 'className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white dark:hover:bg-slate-700 hover:text-primary disabled:opacity-30 sm:h-8 sm:w-8"'
    }
]);
