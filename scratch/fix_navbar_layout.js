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

replaceInFile('front/components/Navbar.tsx', [
    {
        search: /className="section-shell flex items-center gap-4 py-3 md:py-4"/g,
        replace: 'className="w-full px-4 md:px-8 lg:px-12 flex items-center gap-4 py-3 md:py-4 max-w-[1920px] mx-auto"'
    },
    {
        search: /className="relative hidden min-w-0 flex-1 items-center justify-between gap-1 overflow-x-auto overflow-y-visible pt-1 pb-3 pl-6 pr-2 scrollbar-premium md:flex"/g,
        replace: 'className="relative hidden min-w-0 flex-1 items-center justify-center gap-4 lg:gap-8 overflow-x-auto overflow-y-visible pt-1 pb-3 pl-6 pr-2 scrollbar-premium md:flex w-full"'
    },
    {
        search: /className="group relative whitespace-nowrap text-xs font-bold tracking-tight text-ink\/80 dark:text-slate-300 transition-all hover:text-primary px-1"/g,
        replace: 'className="group relative whitespace-nowrap text-sm font-bold tracking-tight text-ink/80 dark:text-slate-300 transition-all hover:text-primary px-1"'
    },
    {
        search: /className="absolute -right-3 top-0\.5 z-20 inline-flex h-5 min-w-\[20px\] items-center justify-center rounded-full bg-red-600 px-1 text-\[10px\] font-bold leading-none text-white shadow ring-2 ring-white dark:ring-slate-900"/g,
        replace: 'className="absolute -right-4 -top-2\.5 z-20 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow ring-2 ring-white dark:ring-slate-900"'
    }
]);
