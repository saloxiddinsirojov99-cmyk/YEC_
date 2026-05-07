const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    
    replacements.forEach(({ search, replace }) => {
        content = content.replace(search, replace);
    });
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Updated', filePath);
}

replaceInFile('front/app/admin/page.tsx', [
    {
        search: /className="rounded-full bg-sky-100 px-3 py-1 font-semibold text-sky-700"/g,
        replace: 'className="rounded-full bg-sky-100 px-3 py-1 font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"'
    },
    {
        search: /className="relative h-72 border-b border-slate-200 px-2"/g,
        replace: 'className="relative h-72 border-b border-slate-200 dark:border-white/10 px-2"'
    },
    {
        search: /className="h-px w-full bg-blue-200\/70"/g,
        replace: 'className="h-px w-full bg-blue-200/70 dark:bg-blue-900/40"'
    },
    {
        search: /className="h-px w-full bg-blue-200\/55"/g,
        replace: 'className="h-px w-full bg-blue-200/55 dark:bg-blue-900/30"'
    },
    {
        search: /className="h-px w-full bg-blue-200\/45"/g,
        replace: 'className="h-px w-full bg-blue-200/45 dark:bg-blue-900/20"'
    },
    {
        search: /className="h-px w-full bg-blue-200\/35"/g,
        replace: 'className="h-px w-full bg-blue-200/35 dark:bg-blue-900/10"'
    },
    {
        search: /className="mb-2 text-xs font-bold text-blue-700"/g,
        replace: 'className="mb-2 text-xs font-bold text-blue-700 dark:text-blue-400"'
    },
    {
        search: /className="absolute bottom-0 left-1\/2 h-full w-px -translate-x-1\/2 bg-blue-200"/g,
        replace: 'className="absolute bottom-0 left-1/2 h-full w-px -translate-x-1/2 bg-blue-200 dark:bg-blue-900/60"'
    },
    {
        search: /bg-blue-300/g,
        replace: 'bg-blue-300 dark:bg-blue-800'
    }
]);
