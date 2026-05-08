'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Carpet } from '@/types/carpet';
import { getImageUrl } from '@/services/api';
import { getPricePerM2 } from '@/utils/size';

interface NikeStyleSliderProps {
  carpets: Carpet[];
}

export default function NikeStyleSlider({ carpets }: NikeStyleSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bgColors, setBgColors] = useState<Record<number, string>>({});

  // Auto-play
  useEffect(() => {
    if (!carpets || carpets.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carpets.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carpets]);

  const safeCarpets = carpets && carpets.length > 0 ? carpets : [];
  const currentCarpet = safeCarpets[currentIndex];
  
  // Random image selection within the current carpet's gallery
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  useEffect(() => {
    if (currentCarpet?.images?.length > 1) {
      // Pick a random image each time the slide becomes active
      const newIndex = Math.floor(Math.random() * currentCarpet.images.length);
      setActiveImageIndex(newIndex);
    } else {
      setActiveImageIndex(0);
    }
  }, [currentIndex, currentCarpet]);

  const fallbackImg = '/images/hero-carpet-green.png'; 
  const currentImgUrl = currentCarpet?.images?.[activeImageIndex] 
    ? (getImageUrl(currentCarpet.images[activeImageIndex]) ?? fallbackImg)
    : fallbackImg;

  const catName = (currentCarpet?.category?.name || currentCarpet?.name || '').toLowerCase();

  const getStyleProps = (name: string) => {
    if (name.includes('iran soft') || name.includes('eron')) {
      return { 
        title: "Eron originalligi va o'ta qulay mayinlik", 
        desc: "Eron texnologiyasi asosida to'qilgan ushbu kolleksiya o'zining noyob naqshlari va o'ta mayinligi bilan ajralib turadi.",
        fallbackBg: "rgb(122, 46, 46)"
      };
    }
    if (name.includes('steffani') || name.includes('stefani')) {
      return { 
        title: "Zamonaviy interyer uchun mukammal do'st", 
        desc: "Steffani kolleksiyasi zamonaviy dizayn va sifatni o'zida jamlagan. Xonangizni yorug' va keng ko'rsatib, joziba yaratadi.",
        fallbackBg: "rgb(75, 62, 106)"
      };
    }
    if (name.includes('verona')) {
      return { 
        title: "Klassik nafislik va takrorlanmas ohang", 
        desc: "Verona gilamlari o'zining boy naqshlari va klassik uslubi bilan ajralib turadi. Katta xonalar uchun eng zo'r tanlov.",
        fallbackBg: "rgb(166, 91, 46)"
      };
    }
    if (name.includes('akril') || name.includes('acrylic')) {
      return { 
        title: "Yorqin tekstura va mustahkam tola", 
        desc: "Akril gilamlar yorqin ranglarini umuman yo'qotmaydi. Uyingizning har bir burchagida xavfsiz va shinam.",
        fallbackBg: "rgb(37, 92, 105)"
      };
    }
    return { 
      title: "YEC gilamlari sharqona sifat belgisi", 
      desc: "Toshkent bo'ylab sifatli va premium mahsulotlar ulgurji markazi. Eng zamonaviy gilamlarimiz bilan tanishing.",
      fallbackBg: "rgb(30, 58, 95)"
    };
  };

  const styleProps = getStyleProps(catName);

  // Haqiqiy rasm rangini tortib olish (100% lagnisiz ishlaydi Canvas orqali)
  useEffect(() => {
    if (!currentImgUrl) return;
    if (bgColors[currentIndex]) return; // agar biz oldin rangini topsak qaytarmaymiz

    const img = new window.Image();
    img.crossOrigin = "Anonymous"; 
    img.src = currentImgUrl;
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;
        canvas.width = 64;
        canvas.height = 64;
        context.drawImage(img, 0, 0, 64, 64);
        const data = context.getImageData(0, 0, 64, 64).data;
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let i = 0; i < data.length; i += 16) { 
          // Shaffofsizlarni tekshirish (faqat haqiqiy gilam piksellarini sanash)
          if(data[i+3] > 128) { 
            const avg = (data[i] + data[i+1] + data[i+2]) / 3;
            // O'ta qora yoki o'ppa-oq ranglarni tashlab yuboramiz
            if(avg > 30 && avg < 240) { 
              r += data[i];
              g += data[i+1];
              b += data[i+2];
              count++;
            }
          }
        }
        
        if (count > 0) {
          // 0.65 ga ko'paytirib biroz to'qlashtiramiz (text o'qilishi oson bo'lishi uchun)
          const finalR = Math.floor((r / count) * 0.65);
          const finalG = Math.floor((g / count) * 0.65);
          const finalB = Math.floor((b / count) * 0.65);
          setBgColors(prev => ({ ...prev, [currentIndex]: `rgb(${finalR}, ${finalG}, ${finalB})` }));
        }
      } catch (e) {
        // Agar rasm o'qilmasa, tepadagi tayyor ranglar (fallbackBg) olinadi
      }
    };
  }, [currentImgUrl, currentIndex, bgColors]);

  const activeColor = bgColors[currentIndex] || styleProps.fallbackBg;

  return (
    <section 
      className="relative w-full rounded-[2.5rem] md:rounded-[3rem] overflow-hidden my-4 md:my-6 min-h-[340px] md:min-h-[460px] shadow-[0_30px_60px_rgba(0,0,0,0.15)] transition-colors duration-[1500ms] ease-in-out group"
      style={{ backgroundColor: activeColor }}
    >
      {/* Light gradient for dynamic background depth (zero lag, pure css) */}
      <div 
        className="absolute -top-[50%] -left-[20%] w-[120%] h-[150%] pointer-events-none z-0 opacity-40 mix-blend-soft-light" 
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)' }} 
      />
      <div 
        className="absolute -bottom-[30%] -right-[10%] w-[80%] h-[100%] pointer-events-none z-0 opacity-20" 
        style={{ background: 'radial-gradient(circle, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 60%)' }} 
      />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-0" />

      {/* Chap tomondagi yozuvlar orqasiga YEC logotipi (Watermark) surat bilan */}
      <div className="absolute top-0 bottom-0 left-[-5%] md:left-[0%] w-full md:w-[55%] z-0 flex items-center justify-center pointer-events-none select-none">
        <div className="w-[90%] md:w-[100%] max-w-none opacity-[0.04] rotate-[18deg] transform flex items-center justify-center">
           <h3 className="text-[12vw] font-black text-white whitespace-nowrap">YEC MARKET</h3>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[1280px] mx-auto grid min-h-[300px] md:min-h-[400px] items-center gap-6 md:gap-8 px-6 lg:px-10 py-4 md:py-6 lg:grid-cols-2">
        {/* Text Section */}
        <div className="z-40 row-start-2 lg:row-start-1 relative lg:-mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${currentIndex}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest text-white uppercase border border-white/20 rounded-full bg-black/10 backdrop-blur-md shadow-sm">
                  {currentCarpet?.category?.name || "Eksklyuziv Kolleksiya"}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-sans font-bold tracking-tight text-white leading-[1.4] max-w-[90%] drop-shadow-sm">
                {styleProps.title}
              </h2>
              <p className="mt-4 max-w-md text-sm md:text-base leading-relaxed text-white/90 drop-shadow-sm">
                {styleProps.desc}
              </p>

              {/* Aniq Model nomi va Kv.M narxi uchun hudud */}
              <div className="mt-4 pt-4 md:mt-6 md:pt-5 border-t border-white/20 flex flex-col gap-1.5">
                <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide drop-shadow-md">
                  {currentCarpet?.name?.split(' ')[0]}
                </h3>
                {(() => {
                  const m2Price = getPricePerM2(currentCarpet?.price || 0, currentCarpet?.size || "");
                  const displayPrice = m2Price && m2Price > 0 ? String(Math.round(m2Price)) : (currentCarpet?.price && currentCarpet?.price !== "0" ? currentCarpet.price : null);
                  const isPerM2 = m2Price && m2Price > 0;
                  
                  if (!displayPrice || displayPrice === "0") return null;
                  
                  return (
                    <p className="text-[#D4AF37] font-bold text-xl md:text-2xl tracking-tight drop-shadow-md">
                      {Number(displayPrice).toLocaleString()} so'm{' '}
                      {isPerM2 && <span className="text-xs md:text-sm font-medium text-white/80 lowercase">/ 1 m²</span>}
                    </p>
                  );
                })()}
              </div>
            </motion.div>
          </AnimatePresence>

          <Link 
            href={`/carpets?search=${encodeURIComponent(currentCarpet?.name?.split(' ')[0] || '')}`} 
            className="mt-6 md:mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-transform hover:scale-105 shadow-[0_10px_30px_rgba(255,255,255,0.2)]"
          >
            Batafsil ko'rish
          </Link>
        </div>

        {/* Floating Carpet Section */}
        <div className="relative z-40 w-full flex justify-center items-center row-start-1 lg:row-start-1 lg:ml-8 perspective-[1000px]">
           {/* Static ambient Nike-style rings (optimized, not rotating to save GPU) */}
           <div className="absolute flex justify-center items-center w-[120%] h-[120%] max-w-[600px] pointer-events-none z-0">
             <div className="w-full aspect-[2/1] border-[1.5px] border-white/10 rounded-[100%] transform -rotate-6 absolute" />
             <div className="w-[80%] aspect-[2/1] border-[1px] border-white/5 rounded-[100%] transform rotate-6 absolute" />
           </div>
           
           <AnimatePresence mode="popLayout">
              <motion.div
                key={`img-${currentIndex}`}
                initial={{ opacity: 0, x: 200, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -200, scale: 0.8 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
                className="relative z-10 w-full max-w-[200px] sm:max-w-[280px] md:max-w-[420px] lg:max-w-[500px] mx-auto"
                style={{ willChange: "transform, opacity" }}
              >
                  {/* Floating effect hardware accelerated */}
                  <motion.div 
                    animate={{ y: [0, -20, 0] }} 
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-full relative flex justify-center items-center rounded-[1.5rem]"
                    style={{ willChange: "transform" }}
                  >
                     <img
                       src={currentImgUrl}
                       className="w-full h-auto object-contain max-h-[300px] sm:max-h-[350px] md:max-h-[420px] lg:max-h-[480px] drop-shadow-[0_20px_20px_rgba(0,0,0,0.4)]"
                       alt="Featured premium carpet"
                     />
                     {/* Bellow shadow for depth */}
                     <div className="absolute -bottom-8 w-[80%] h-6 bg-black/40 blur-xl rounded-[100%] pointer-events-none" />
                  </motion.div>
              </motion.div>
           </AnimatePresence>
        </div>
      </div>

      {/* Indicators */}
      {safeCarpets.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-2 items-center p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
          {safeCarpets.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ease-out focus:outline-none ${
                idx === currentIndex ? 'bg-white w-8 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'w-2.5 bg-white/40 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
