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

// Home page category cards
replaceInFile('front/app/page.tsx', [
    {
        search: /className="group relative block aspect-\[4\/5\] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl md:rounded-3xl"/g,
        replace: 'className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-white/10 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl md:rounded-3xl"'
    }
]);

// Sevimlilar page empty state button
replaceInFile('front/app/sevimlilar/page.tsx', [
    {
        search: /className="inline-flex items-center justify-center rounded-2xl border border-ink\/10 bg-white px-6 py-3 text-xs font-bold uppercase tracking-\[0\.16em\] text-ink transition-all hover:-translate-y-0\.5 hover:border-ink\/20"/g,
        replace: 'className="inline-flex items-center justify-center rounded-2xl border border-ink/10 bg-white dark:bg-slate-800 dark:border-white/10 dark:text-white px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-ink transition-all hover:-translate-y-0.5 hover:border-ink/20"'
    },
    {
        search: /className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-\[0_12px_32px_-20px_rgba\(244,63,94,0\.7\)\]"/g,
        replace: 'className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-[0_12px_32px_-20px_rgba(244,63,94,0.7)]"'
    }
]);

// Reset password page card
replaceInFile('front/app/reset-password/page.tsx', [
    {
        search: /className="w-full max-w-md space-y-8 rounded-3xl border border-ink\/5 bg-white\/70 p-8 shadow-2xl backdrop-blur-2xl"/g,
        replace: 'className="w-full max-w-md space-y-8 rounded-3xl border border-ink/5 bg-white/70 dark:bg-slate-900/80 dark:border-white/10 p-8 shadow-2xl backdrop-blur-2xl"'
    }
]);

// Loading page wrapper
replaceInFile('front/app/loading.tsx', [
    {
        search: /className="pointer-events-none fixed inset-0 z-\[9998\] flex items-center justify-center bg-white\/45 backdrop-blur-\[2px\]"/g,
        replace: 'className="pointer-events-none fixed inset-0 z-[9998] flex items-center justify-center bg-white/45 dark:bg-slate-900/60 backdrop-blur-[2px]"'
    },
    {
        search: /className="relative inline-flex h-28 w-28 items-center justify-center rounded-full border border-primary\/15 bg-white\/90 p-2 shadow-\[0_12px_32px_rgba\(0,0,0,0\.14\)\]"/g,
        replace: 'className="relative inline-flex h-28 w-28 items-center justify-center rounded-full border border-primary/15 bg-white/90 dark:bg-slate-800/90 p-2 shadow-[0_12px_32px_rgba(0,0,0,0.14)]"'
    }
]);

// Global error page
replaceInFile('front/app/global-error.tsx', [
    {
        search: /className="bg-white text-ink"/g,
        replace: 'className="bg-white text-ink dark:bg-slate-900 dark:text-slate-100"'
    },
    {
        search: /className="relative inline-flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white ring-4 ring-primary\/20 shadow-\[0_0_40px_rgba\(0,180,255,0\.18\)\]"/g,
        replace: 'className="relative inline-flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white dark:bg-slate-800 ring-4 ring-primary/20 shadow-[0_0_40px_rgba(0,180,255,0.18)]"'
    }
]);

