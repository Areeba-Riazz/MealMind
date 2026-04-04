import { Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import Navbar from '../components/Navbar';

const floatingFoods = ['🍛', '🥘', '🫓', '🍖', '🧆', '🥗', '🍳', '🌶️', '🫚', '🍚', '🥙', '🍜', '🥑', '🍱', '🌮', '🧅', '🫛', '🥦', '🍣', '☕', '🧁', '🍰', '🍜', '🫖', '🍩'];

const TESTIMONIALS = [
  { name: 'Ayesha Malik', role: 'Student, LUMS', city: 'Lahore', text: 'Mujhe kabhi samajh nahi aata tha ghar mein kya pakana hai. MealMind ne sab badal diya. Seriously, 10 seconds mein perfect meal idea. Zabardast!', avatar: '👩‍🎓', stars: 5 },
  { name: 'Bilal Ahmed', role: 'Young Professional', city: 'Karachi', text: "I was wasting like Rs. 800 a day on delivery. Now I cook with whatever's in my fridge and spend way less. This app paid for itself on day one.", avatar: '👨‍💼', stars: 5 },
  { name: 'Sana Hussain', role: 'Fitness Coach', city: 'Islamabad', text: "Finally an app that understands Pakistani food AND tracks macros. I can plan a high-protein daal or seekh kebab day without doing any math.", avatar: '💪', stars: 5 },
  { name: 'Usman Tariq', role: 'Father of 3', city: 'Rawalpindi', text: "My wife and I used to argue about what to cook every single night. Now we just open MealMind. Family meals sorted in seconds. No more stress.", avatar: '👨‍👩‍👧‍👦', stars: 5 },
  { name: 'Mahnoor Riaz', role: 'Medical Student', city: 'Peshawar', text: "Between classes and rotations I have zero time. MealMind gives me budget desi meals that hit my nutrition targets. It feels like having a nutritionist best friend.", avatar: '🩺', stars: 5 },
  { name: 'Hamza Sheikh', role: 'Gym Enthusiast', city: 'Lahore', text: "Bhai protein ke liye chicken breast hi nahi hoti. MealMind mujhe daal gosht, chanay, aur ande se bhi macro targets hit karta deta hai. Best app.", avatar: '🏋️', stars: 5 },
  { name: 'Fatima Zahra', role: 'Homemaker', city: 'Multan', text: "Ghar ka budget tight hai lekin MealMind ne itne saste aur tasty options diye hain ke poori family khush hai. Waste bhi bilkul nahi hota ab.", avatar: '🏠', stars: 5 },
  { name: 'Zaid Khan', role: 'Startup Founder', city: 'Karachi', text: "I literally did not have time to think about food. MealMind handles the decision entirely. I just pick what it suggests and cook in 20 mins. Game changer.", avatar: '🚀', stars: 5 },
];

const tickerItems = [
  '🍛 Chicken Biryani', '🥘 Daal Makhani', '🫓 Aloo Paratha', '🍖 Seekh Kebab', '🧆 Shami Kebab',
  '🍳 Anda Bhurji', '🥘 Nihari', '🌶️ Karahi Gosht', '🍚 Pulao', '🥙 Shawarma Roll',
  '🥗 Raita Salad Bowl', '🍜 Saag', '🧅 Onion Pakora', '🫛 Chana Masala', '🥑 Avocado Toast',
  '🍣 Salmon Sushi', '☕ Dalgona Coffee', '🧁 Red Velvet Cupcake', '🍰 Lotus Biscoff Cake', '🍜 Ramen Bowl',
  '🫖 Kashmiri Chai', '🍩 Glazed Donuts', '🍱 Bento Box', '🌮 Beef Tacos', '🥐 Croissant Sandwich',
  '🍛 Chicken Biryani', '🥘 Daal Makhani', '🫓 Aloo Paratha', '🍖 Seekh Kebab', '🧆 Shami Kebab',
  '🍳 Anda Bhurji', '🥘 Nihari', '🌶️ Karahi Gosht', '🍚 Pulao', '🥙 Shawarma Roll',
  '🥗 Raita Salad Bowl', '🍜 Saag', '🧅 Onion Pakora', '🫛 Chana Masala', '🥑 Avocado Toast',
  '🍣 Salmon Sushi', '☕ Dalgona Coffee', '🧁 Red Velvet Cupcake', '🍰 Lotus Biscoff Cake', '🍜 Ramen Bowl',
  '🫖 Kashmiri Chai', '🍩 Glazed Donuts', '🍱 Bento Box', '🌮 Beef Tacos', '🥐 Croissant Sandwich',
];

export default function LandingPage() {
  const [activeT, setActiveT] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const CARD_WIDTH = 354;

  const nextT = useCallback(() => setActiveT(p => (p + 1) % TESTIMONIALS.length), []);
  const prevT = useCallback(() => setActiveT(p => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length), []);

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(nextT, 4200);
  }, [nextT]);

  useEffect(() => { resetTimer(); return () => clearInterval(timerRef.current); }, [resetTimer]);

  const onDragStart = (x: number) => { setIsDragging(true); setDragStart(x); setDragDelta(0); clearInterval(timerRef.current); };
  const onDragMove = (x: number) => { if (isDragging) setDragDelta(x - dragStart); };
  const onDragEnd = () => {
    if (Math.abs(dragDelta) > 55) dragDelta < 0 ? nextT() : prevT();
    setIsDragging(false); setDragDelta(0); resetTimer();
  };

  const faqs = [
    { q: 'Is MealMind free to use?', a: 'Yes! MealMind has a generous free tier with 10 AI meal suggestions per day. Our Pro plan unlocks unlimited suggestions, weekly meal planning, grocery list export, and more.' },
    { q: 'Does it understand desi ingredients and local cuisine?', a: 'Absolutely. MealMind is built with desi cuisine in mind — it knows your masala dabba, understands atta, daal, sabzi, and can plan full sehri and iftar meals. It even accounts for local grocery prices.' },
    { q: 'Can I use it for weight loss or muscle gain?', a: 'Yes. Set your goal (weight loss, muscle gain, maintenance) and MealMind tailors every suggestion to hit your calorie and macro targets using the foods you already have or want to order.' },
    { q: 'Does it work for families?', a: 'Definitely. You can set servings for your whole family and MealMind will scale ingredients accordingly, keeping budget and nutrition targets in check for everyone.' },
    { q: 'What if I have dietary restrictions?', a: 'MealMind supports vegetarian, vegan, gluten-free, diabetic-friendly, and more. Just set your preferences once and every suggestion will automatically respect them.' },
    { q: 'How does the food ordering feature work?', a: 'Tell MealMind your mood, budget, and location and it will recommend exactly what to order and from which restaurant near you — from biryani spots to sushi bars and everything in between.' },
  ];

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--text); font-family: var(--font-body); overflow-x: hidden; }

        .food-float { position: fixed; pointer-events: none; z-index: 0; animation: floatUp linear infinite; opacity: 0.08; user-select: none; }
        @keyframes floatUp { 0% { transform: translateY(110vh) rotate(0deg); } 100% { transform: translateY(-150px) rotate(360deg); } }

        /* HERO */
        .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 9rem 2rem 5rem; position: relative; overflow: hidden; }
        .glow { position: absolute; border-radius: 50%; filter: blur(110px); pointer-events: none; z-index: 0; }
        .glow-1 { width: 700px; height: 700px; background: radial-gradient(circle, rgba(232,82,42,0.16), transparent 70%); top: -150px; left: -150px; }
        .glow-2 { width: 550px; height: 550px; background: radial-gradient(circle, rgba(245,200,66,0.1), transparent 70%); bottom: -80px; right: -80px; }
        .glow-3 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(46,194,126,0.07), transparent 70%); top: 40%; left: 55%; }
        .pill { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.45rem 1.15rem; background: rgba(232,82,42,0.1); border: 1px solid rgba(232,82,42,0.28); border-radius: 100px; color: var(--accent); font-weight: 700; font-size: 0.78rem; margin-bottom: 2rem; letter-spacing: 1px; text-transform: uppercase; position: relative; z-index: 1; animation: fadeUp 0.6s ease both; }
        .hero h1 { font-family: var(--font-head); font-size: clamp(2.6rem, 7.5vw, 6.2rem); font-weight: 800; line-height: 1.03; letter-spacing: -2.5px; margin-bottom: 1.8rem; z-index: 1; position: relative; animation: fadeUp 0.7s 0.1s ease both; }
        .hero h1 em { font-style: normal; background: linear-gradient(120deg, var(--accent), var(--accent2) 60%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-sub { font-size: 1.12rem; color: var(--muted); max-width: 560px; line-height: 1.8; margin-bottom: 2.8rem; z-index: 1; position: relative; animation: fadeUp 0.7s 0.2s ease both; }
        .hero-btns { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; z-index: 1; position: relative; animation: fadeUp 0.7s 0.3s ease both; margin-bottom: 3rem; }
        .btn-main { background: var(--accent); color: #fff; padding: 1rem 2.2rem; border-radius: 100px; font-weight: 700; font-size: 1rem; text-decoration: none; display: inline-block; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 8px 32px rgba(232,82,42,0.35); }
        .btn-main:hover { transform: translateY(-3px); box-shadow: 0 16px 44px rgba(232,82,42,0.45); }
        .btn-ghost { background: transparent; color: var(--text); padding: 1rem 2.2rem; border-radius: 100px; font-weight: 600; font-size: 1rem; text-decoration: none; border: 1px solid var(--border2); transition: border-color 0.2s, background 0.2s; }
        .btn-ghost:hover { border-color: var(--accent); background: var(--glass-hover); }
        .hero-trust { display: flex; align-items: center; gap: 0.7rem; color: var(--muted); font-size: 0.82rem; z-index: 1; position: relative; animation: fadeUp 0.7s 0.4s ease both; flex-wrap: wrap; justify-content: center; }
        .trust-avatars { display: flex; }
        .trust-avatars span { width: 30px; height: 30px; border-radius: 50%; background: var(--surface2); border: 2px solid var(--bg); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; margin-left: -8px; }
        .trust-avatars span:first-child { margin-left: 0; }

        /* STATS */
        .stats-strip { display: flex; justify-content: center; flex-wrap: wrap; background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .stat-item { flex: 1; min-width: 120px; padding: 2rem 1.5rem; text-align: center; border-right: 1px solid var(--border); }
        .stat-item:last-child { border-right: none; }
        .stat-num { font-family: var(--font-head); font-size: 2.3rem; font-weight: 800; color: var(--accent); display: block; }
        .stat-label { font-size: 0.75rem; color: var(--muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 0.3rem; display: block; }

        /* TICKER */
        .ticker-wrap { overflow: hidden; background: var(--bg); border-bottom: 1px solid var(--border); padding: 1.1rem 0; mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent); }
        .ticker-inner { display: flex; gap: 2.2rem; width: max-content; animation: ticker 52s linear infinite; }
        .ticker-item { display: flex; align-items: center; gap: 0.5rem; color: var(--muted); font-size: 0.88rem; font-weight: 500; white-space: nowrap; }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* SECTIONS */
        section { padding: 7rem 2rem; position: relative; }
        .container { max-width: 1120px; margin: 0 auto; }
        .section-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: var(--accent); margin-bottom: 0.9rem; }
        .section-title { font-family: var(--font-head); font-size: clamp(1.9rem, 4vw, 3.2rem); font-weight: 800; letter-spacing: -1.2px; line-height: 1.08; margin-bottom: 1.2rem; }
        .section-sub { color: var(--muted); font-size: 1.05rem; line-height: 1.75; max-width: 520px; }
        .centered { text-align: center; margin-inline: auto; }

        /* FEATURES */
        .feat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.4rem; margin-top: 4rem; }
        .feat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 2.2rem; transition: transform 0.3s, border-color 0.3s, box-shadow 0.3s; position: relative; overflow: hidden; }
        .feat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--c, var(--accent)); }
        .feat-card:hover { transform: translateY(-5px); border-color: var(--accent); box-shadow: 0 20px 50px rgba(0,0,0,0.15); }
        .feat-icon { font-size: 2.8rem; margin-bottom: 1.2rem; }
        .feat-title { font-family: var(--font-head); font-size: 1.2rem; font-weight: 700; margin-bottom: 0.65rem; }
        .feat-desc { color: var(--muted); line-height: 1.65; font-size: 0.93rem; }

        /* DESI */
        .desi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; margin-top: 4rem; }
        .desi-hero-card { grid-column: 1 / -1; background: linear-gradient(135deg, rgba(232,82,42,0.12), rgba(245,200,66,0.07)); border: 1px solid rgba(232,82,42,0.2); border-radius: var(--radius-lg); padding: 3rem; display: flex; align-items: center; justify-content: space-between; gap: 2rem; flex-wrap: wrap; }
        .desi-hero-text h3 { font-family: var(--font-head); font-size: 1.8rem; font-weight: 800; margin-bottom: 0.7rem; letter-spacing: -0.5px; }
        .desi-hero-text p { color: var(--muted); font-size: 1rem; line-height: 1.7; max-width: 420px; }
        .desi-emoji-cloud { display: flex; flex-wrap: wrap; gap: 0.7rem; font-size: 2.4rem; max-width: 240px; justify-content: center; }
        .desi-mini { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.8rem; transition: border-color 0.3s; }
        .desi-mini:hover { border-color: var(--border2); }
        .desi-mini .dm-icon { font-size: 2rem; margin-bottom: 0.8rem; }
        .desi-mini h4 { font-family: var(--font-head); font-size: 1.05rem; font-weight: 700; margin-bottom: 0.4rem; }
        .desi-mini p { font-size: 0.88rem; color: var(--muted); line-height: 1.6; }

        /* HOW */
        .how-grid { display: flex; gap: 0; margin-top: 4.5rem; justify-content: center; flex-wrap: wrap; }
        .how-mode-tabs { display: flex; gap: 0.8rem; justify-content: center; margin-bottom: 3rem; flex-wrap: wrap; }
        .how-tab { padding: 0.6rem 1.4rem; border-radius: 100px; font-size: 0.88rem; font-weight: 600; cursor: pointer; border: 1px solid var(--border2); background: transparent; color: var(--muted); transition: all 0.25s; font-family: var(--font-body); }
        .how-tab.active { background: var(--accent); color: #fff; border-color: var(--accent); box-shadow: 0 4px 18px rgba(232,82,42,0.3); }
        .how-flow { display: none; }
        .how-flow.active { display: flex; flex-wrap: wrap; justify-content: center; gap: 0; }
        .how-step { flex: 1; min-width: 180px; max-width: 280px; padding: 2.5rem 1.8rem; text-align: center; position: relative; }
        .how-step:not(:last-child)::after { content: '→'; position: absolute; right: -8px; top: 42%; font-size: 1.4rem; color: var(--border2); }
        .step-badge { width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-family: var(--font-head); font-size: 0.85rem; margin: 0 auto 1rem; border: 2px solid; }
        .step-emoji { font-size: 3.2rem; margin-bottom: 1rem; }
        .step-text { font-size: 1rem; font-weight: 600; line-height: 1.4; }

        /* TESTIMONIALS */
        .t-carousel { position: relative; margin-top: 4rem; }
        .t-track-wrap { overflow: hidden; padding: 1rem 0 2rem; cursor: grab; }
        .t-track-wrap:active { cursor: grabbing; }
        .t-track { display: flex; gap: 1.4rem; will-change: transform; transition: transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
        .t-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem; min-width: 340px; max-width: 340px; flex-shrink: 0; cursor: pointer; transition: border-color 0.3s, box-shadow 0.3s; }
        .t-card.active-card { border-color: rgba(232,82,42,0.3); box-shadow: 0 0 0 1px rgba(232,82,42,0.12), 0 20px 50px rgba(0,0,0,0.35); }
        .t-stars { display: flex; gap: 2px; margin-bottom: 1rem; }
        .t-text { font-size: 0.94rem; color: var(--text); line-height: 1.72; margin-bottom: 1.4rem; font-style: italic; }
        .t-footer { display: flex; align-items: center; gap: 0.9rem; }
        .t-avatar { width: 42px; height: 42px; border-radius: 50%; background: var(--surface2); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; border: 1px solid var(--border); }
        .t-name { font-weight: 700; font-size: 0.92rem; font-family: var(--font-head); }
        .t-meta { font-size: 0.78rem; color: var(--muted); margin-top: 0.1rem; }
        .t-controls { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.5rem; }
        .t-btn { background: var(--surface); border: 1px solid var(--border); color: var(--text); width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 1rem; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .t-btn:hover { background: var(--surface2); border-color: var(--border2); }
        .t-dots { display: flex; gap: 0.45rem; }
        .t-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border2); border: none; cursor: pointer; padding: 0; transition: background 0.3s, transform 0.3s; }
        .t-dot.on { background: var(--accent); transform: scale(1.5); }

        /* PRICING */
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.4rem; max-width: 920px; margin: 4rem auto 0; }
        .price-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 2.5rem; position: relative; transition: transform 0.3s; }
        .price-card:hover { transform: translateY(-4px); }
        .price-card.featured { border-color: rgba(232,82,42,0.4); background: linear-gradient(160deg, rgba(232,82,42,0.07), var(--surface)); }
        .price-badge-wrap { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); }
        .price-badge { background: var(--accent); color: #fff; font-size: 0.72rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 0.3rem 1rem; border-radius: 100px; white-space: nowrap; }
        .price-name { font-family: var(--font-head); font-size: 1.1rem; font-weight: 800; margin-bottom: 0.8rem; }
        .price-amount { font-family: var(--font-head); font-size: 2.5rem; font-weight: 800; letter-spacing: -1px; margin-bottom: 0.3rem; }
        .price-amount span { font-size: 1rem; font-weight: 400; color: var(--muted); }
        .price-desc { font-size: 0.87rem; color: var(--muted); margin-bottom: 2rem; line-height: 1.55; }
        .price-features { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem; }
        .price-features li { font-size: 0.88rem; display: flex; gap: 0.65rem; align-items: flex-start; line-height: 1.4; }
        .price-features li::before { content: '✓'; color: var(--accent3); font-weight: 700; margin-top: 0.05rem; flex-shrink: 0; }
        .price-features li.off { color: var(--muted); }
        .price-features li.off::before { content: '—'; color: var(--muted2); }
        .btn-price { width: 100%; padding: 0.9rem; border-radius: 100px; font-weight: 700; font-size: 0.92rem; text-align: center; text-decoration: none; display: block; transition: all 0.2s; border: none; cursor: pointer; font-family: var(--font-body); }
        .btn-price-accent { background: var(--accent); color: #fff; box-shadow: 0 6px 24px rgba(232,82,42,0.3); }
        .btn-price-accent:hover { opacity: 0.88; transform: translateY(-2px); }
        .btn-price-outline { background: transparent; color: var(--text); border: 1px solid var(--border2); }
        .btn-price-outline:hover { background: var(--surface2); }

        /* FAQ */
        .faq-list { max-width: 760px; margin: 3.5rem auto 0; display: flex; flex-direction: column; gap: 0.8rem; }
        .faq-item { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; transition: border-color 0.3s; }
        .faq-item.open { border-color: rgba(232,82,42,0.25); }
        .faq-q { width: 100%; background: none; border: none; color: var(--text); padding: 1.4rem 1.6rem; text-align: left; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 0.96rem; font-weight: 600; font-family: var(--font-body); gap: 1rem; }
        .faq-icon { color: var(--accent); font-size: 1.4rem; flex-shrink: 0; transition: transform 0.35s; line-height: 1; }
        .faq-icon.open { transform: rotate(45deg); }
        .faq-body { max-height: 0; overflow: hidden; transition: max-height 0.4s ease; }
        .faq-body.open { max-height: 300px; }
        .faq-inner { padding: 0 1.6rem 1.4rem; color: var(--muted); font-size: 0.92rem; line-height: 1.7; }

        /* CTA */
        .cta-box { background: linear-gradient(135deg, rgba(232,82,42,0.13), rgba(245,200,66,0.06)); border: 1px solid rgba(232,82,42,0.22); border-radius: var(--radius-lg); max-width: 840px; margin: 0 auto; padding: 5.5rem 3rem; text-align: center; position: relative; overflow: hidden; }
        .cta-box::before { content: '🍛'; position: absolute; font-size: 12rem; bottom: -30px; right: -30px; opacity: 0.05; transform: rotate(15deg); pointer-events: none; }
        .cta-box::after { content: '🌶️'; position: absolute; font-size: 8rem; top: -10px; left: -10px; opacity: 0.05; transform: rotate(-20deg); pointer-events: none; }
        .cta-title { font-family: var(--font-head); font-size: clamp(1.8rem, 4.5vw, 3.2rem); font-weight: 800; letter-spacing: -1px; margin-bottom: 1rem; }
        .cta-sub { color: var(--muted); font-size: 1rem; line-height: 1.75; max-width: 480px; margin-inline: auto; margin-bottom: 2.8rem; }
        .cta-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

        /* FOOTER */
        footer { border-top: 1px solid var(--border); padding: 5rem 2rem 2.5rem; }
        .footer-grid { max-width: 1120px; margin: 0 auto 4rem; display: grid; grid-template-columns: 2.2fr 1fr 1fr 1fr; gap: 3rem; }
        .footer-logo { font-family: var(--font-head); font-weight: 800; font-size: 1.6rem; color: var(--text); text-decoration: none; letter-spacing: -0.5px; display: block; margin-bottom: 1rem; }
        .footer-logo span { color: var(--accent); }
        .footer-desc { color: var(--muted); font-size: 0.88rem; line-height: 1.72; max-width: 280px; margin-bottom: 1.5rem; }
        .footer-socials { display: flex; gap: 0.6rem; }
        .social-btn { width: 36px; height: 36px; border-radius: 8px; background: var(--surface2); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 0.9rem; text-decoration: none; color: var(--muted); transition: all 0.2s; }
        .social-btn:hover { background: var(--surface); border-color: var(--border2); color: var(--text); }
        .footer-col-title { font-family: var(--font-head); font-weight: 700; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 1.2px; color: var(--text); margin-bottom: 1.2rem; }
        .footer-links { list-style: none; display: flex; flex-direction: column; gap: 0.7rem; }
        .footer-links a { color: var(--muted); text-decoration: none; font-size: 0.87rem; transition: color 0.2s; }
        .footer-links a:hover { color: var(--text); }
        .footer-bottom { max-width: 1120px; margin: 0 auto; padding-top: 2rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .footer-copy { font-size: 0.81rem; color: var(--muted); }
        .footer-legal { display: flex; gap: 1.5rem; }
        .footer-legal a { font-size: 0.81rem; color: var(--muted); text-decoration: none; transition: color 0.2s; }
        .footer-legal a:hover { color: var(--text); }
        .footer-badge { display: inline-flex; align-items: center; gap: 0.4rem; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 0.35rem 0.8rem; font-size: 0.77rem; color: var(--muted); }

        /* ANIMATIONS */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }

        /* ========== RESPONSIVE ========== */
        @media (max-width: 1024px) {
          .footer-grid { grid-template-columns: 1fr 1fr; gap: 2rem; }
        }

        @media (max-width: 900px) {
          .desi-grid { grid-template-columns: 1fr; }
          .desi-hero-card { flex-direction: column; text-align: center; }
          .desi-hero-text p { max-width: 100%; }
          .desi-emoji-cloud { margin: 0 auto; }
          .glow-1 { width: 400px; height: 400px; }
          .glow-2 { width: 300px; height: 300px; }
        }

        @media (max-width: 768px) {
          section { padding: 5rem 1.2rem; }

          .hero { padding: 7rem 1.2rem 4rem; }
          .hero h1 { letter-spacing: -1.5px; }
          .hero-sub { font-size: 1rem; }
          .btn-main, .btn-ghost { padding: 0.85rem 1.7rem; font-size: 0.95rem; }

          .stats-strip { gap: 0; }
          .stat-item { min-width: 50%; border-right: none; border-bottom: 1px solid var(--border); padding: 1.5rem 1rem; }
          .stat-item:nth-child(odd) { border-right: 1px solid var(--border); }
          .stat-item:last-child { border-bottom: none; }
          .stat-num { font-size: 1.9rem; }

          .how-step::after { display: none; }
          .how-step { max-width: 100%; min-width: 100%; }

          .cta-box { padding: 3rem 1.5rem; }

          .footer-grid { grid-template-columns: 1fr; gap: 2rem; }
          .footer-bottom { flex-direction: column; text-align: center; }
          .footer-legal { justify-content: center; }

          .t-card { min-width: 290px; max-width: 290px; }

          .pricing-grid { grid-template-columns: 1fr; max-width: 420px; }
          .feat-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
          .hero h1 { font-size: 2.2rem; letter-spacing: -1px; }
          .section-title { font-size: 1.75rem; }
          .cta-title { font-size: 1.7rem; }
          .desi-hero-text h3 { font-size: 1.4rem; }
          .desi-emoji-cloud { font-size: 1.8rem; }
          .t-card { min-width: 260px; max-width: 260px; }
          .pill { font-size: 0.7rem; padding: 0.4rem 0.9rem; }
          .stat-item { min-width: 100%; border-right: none; }
        }
      `}</style>

      {floatingFoods.map((f, i) => (
        <span key={i} className="food-float" style={{
          left: `${(i * 5.8) % 100}%`,
          animationDuration: `${16 + (i * 4.1) % 16}s`,
          animationDelay: `${(i * 2.3) % 14}s`,
          fontSize: `${1.4 + (i % 4) * 0.6}rem`,
        }}>{f}</span>
      ))}

      <Navbar />

      {/* HERO */}
      <section className="hero">
        <div className="glow glow-1" /><div className="glow glow-2" /><div className="glow glow-3" />
        <div className="pill">🌶️ Pakistan's First AI Meal Planner</div>
        <h1>Hungry? Let<br /><em>MealMind Decide.</em></h1>
        <p className="hero-sub">Tell MealMind what's in your fridge — or what you're craving. Get a recipe to cook or a restaurant to order from, in 10 seconds flat.</p>
        <div className="hero-btns">
          <Link to="/demo" className="btn-main">Try AI Chef Free 🚀</Link>
          <Link to="/login" className="btn-ghost">Log Into Account</Link>
        </div>
        <div className="hero-trust">
          <div className="trust-avatars">
            {['🧑', '👩', '👨', '🧕', '👦'].map((a, i) => <span key={i}>{a}</span>)}
          </div>
          <span>Trusted by 50,000+ Pakistani households</span>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-strip">
        {[
          { num: '10s', label: 'Avg. Meal Decision' },
          { num: '40%', label: 'Less Food Wasted' },
          { num: 'Rs.200', label: 'Avg. Daily Savings' },
          { num: '50k+', label: 'Meals Decided' },
          { num: '4.9★', label: 'User Rating' },
        ].map((s, i) => (
          <div className="stat-item" key={i}>
            <span className="stat-num">{s.num}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          {tickerItems.map((item, i) => (
            <span className="ticker-item" key={i}>
              {item}<span style={{ color: 'var(--muted2)', marginLeft: '0.5rem' }}>•</span>
            </span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features">
        <div className="container">
          <p className="section-label centered">What We Do</p>
          <h2 className="section-title centered">Your brain was working too hard</h2>
          <p className="section-sub centered">MealMind handles the mental load of every food decision — cook at home or order out, we've got you covered.</p>
          <div className="feat-grid">
            {[
              { icon: '🧊', title: 'Fridge-First Cooking', desc: 'Type what\'s in your fridge — half an onion, leftover daal, two eggs — and we build a proper meal around it. Zero waste, zero stress.', c: '#38bdf8' },
              { icon: '🛵', title: 'Order In, Sorted', desc: 'Not in the mood to cook? Tell us your craving and budget. We recommend exactly what to order and from which restaurant near you.', c: '#f472b6' },
              { icon: '💸', title: 'Smart Budget Mode', desc: 'Set your exact budget and MealMind ensures every suggestion — whether cooking or ordering — stays within it.', c: '#a78bfa' },
              { icon: '⚡', title: 'Instant Decisions', desc: 'No more 40-minute scrolling sessions. One click and your meal is decided — ingredients, instructions, macros, and cost all in one view.', c: '#fb923c' },
              { icon: '🎯', title: 'Macro & Calorie Tracking', desc: 'Protein, carbs, fat, calories — MealMind calculates everything per serving so you hit your daily targets without a single calculation.', c: '#4ade80' },
              { icon: '📅', title: 'Weekly Meal Planning', desc: 'Plan your entire week of sehri, lunch, dinner, and snacks in one session. Get a combined grocery list with estimated costs.', c: '#fbbf24' },
            ].map((f, i) => (
              <div className="feat-card" key={i} style={{ '--c': f.c } as CSSProperties}>
                <div className="feat-icon">{f.icon}</div>
                <h3 className="feat-title">{f.title}</h3>
                <p className="feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOCAL FOOD SPOTLIGHT */}
      <section id="desi" style={{ background: 'var(--surface)' }}>
        <div className="container">
          <p className="section-label">Built for Pakistan</p>
          <h2 className="section-title">Every craving. Every cuisine.</h2>
          <p className="section-sub">From ghar ka khana to sushi nights — MealMind understands the full range of how Pakistanis eat today.</p>
          <div className="desi-grid">
            <div className="desi-hero-card">
              <div className="desi-hero-text">
                <h3>🍛 Desi Staples to Global Cravings</h3>
                <p>MealMind knows your masala dabba as well as it knows your nearest sushi spot. Whether you want a simple anda paratha on a student budget or a trendy café brunch, it has you covered — with local pricing, real restaurant suggestions, and recipes that work.</p>
              </div>
              <div className="desi-emoji-cloud">
                {['🍛', '🥘', '🫓', '🍖', '🧆', '🍳', '🌶️', '🍣', '🍜', '☕', '🧁', '🍰'].map((e, i) => <span key={i}>{e}</span>)}
              </div>
            </div>
            {[
              { icon: '🕌', title: 'Ramadan Ready', desc: 'Dedicated Sehri and Iftar planners that respect fasting hours, keep you energised, and stay within your daily budget.' },
              { icon: '👨‍👩‍👧‍👦', title: 'Family Servings', desc: 'Cook for 2 or 10. Scale any recipe for the whole ghar in one click — ingredients, cost, and time all adjusted automatically.' },
              { icon: '🛒', title: 'Local Market Prices', desc: 'Budget estimates use real prices from markets in Lahore, Karachi, Islamabad, and Rawalpindi.' },
              { icon: '🌿', title: 'Seasonal Produce', desc: 'MealMind knows what\'s cheap and in season in Pakistan right now — suggestions are always fresh and budget-smart.' },
            ].map((d, i) => (
              <div className="desi-mini" key={i}>
                <div className="dm-icon">{d.icon}</div>
                <h4>{d.title}</h4>
                <p>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how">
        <div className="container" style={{ textAlign: 'center' }}>
          <p className="section-label">The Process</p>
          <h2 className="section-title centered">Pick your mode. Done in seconds.</h2>
          <p className="section-sub centered">Whether you're cooking or ordering, MealMind removes every bit of the guesswork.</p>

          <HowItWorks />
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="reviews" style={{ background: 'var(--surface)' }}>
        <div className="container">
          <p className="section-label">Real People, Real Meals</p>
          <h2 className="section-title">Pakistanis who stopped stressing</h2>
          <p className="section-sub">From students in Lahore to families in Multan — swipe to see what MealMind users are saying.</p>
          <div className="t-carousel">
            <div
              className="t-track-wrap"
              onMouseDown={e => onDragStart(e.clientX)}
              onMouseMove={e => onDragMove(e.clientX)}
              onMouseUp={onDragEnd}
              onMouseLeave={onDragEnd}
              onTouchStart={e => onDragStart(e.touches[0].clientX)}
              onTouchMove={e => onDragMove(e.touches[0].clientX)}
              onTouchEnd={onDragEnd}
            >
              <div
                className="t-track"
                style={{ transform: `translateX(calc(-${activeT * CARD_WIDTH}px + ${dragDelta}px))` }}
              >
                {TESTIMONIALS.map((t, i) => (
                  <div key={i} className={`t-card ${i === activeT ? 'active-card' : ''}`} onClick={() => { setActiveT(i); resetTimer(); }}>
                    <div className="t-stars">{'★★★★★'.split('').map((s, j) => <span key={j} style={{ color: '#f5c842', fontSize: '0.9rem' }}>{s}</span>)}</div>
                    <p className="t-text">"{t.text}"</p>
                    <div className="t-footer">
                      <div className="t-avatar">{t.avatar}</div>
                      <div>
                        <p className="t-name">{t.name}</p>
                        <p className="t-meta">{t.role} · {t.city}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="t-controls">
              <button className="t-btn" onClick={() => { prevT(); resetTimer(); }}>←</button>
              <div className="t-dots">
                {TESTIMONIALS.map((_, i) => (
                  <button key={i} className={`t-dot ${i === activeT ? 'on' : ''}`} onClick={() => { setActiveT(i); resetTimer(); }} />
                ))}
              </div>
              <button className="t-btn" onClick={() => { nextT(); resetTimer(); }}>→</button>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing">
        <div className="container" style={{ textAlign: 'center' }}>
          <p className="section-label">Pricing</p>
          <h2 className="section-title centered">Simple, honest pricing</h2>
          <p className="section-sub centered">No surprises. No hidden fees. Pick the plan that fits your life.</p>
          <div className="pricing-grid">
            {[
              {
                name: 'Free', amount: 'Rs. 0', period: '/ forever',
                desc: 'Perfect for getting started and exploring MealMind.',
                features: ['10 AI meal decisions / day', 'Basic fridge scanner', 'Budget filtering', 'Basic calorie estimates', 'Restaurant suggestions'],
                off: ['Weekly meal planning', 'Grocery list export', 'Family mode (4+ servings)', 'Priority AI responses'],
                cta: 'Get Started Free', accent: false,
              },
              {
                name: 'Pro', amount: 'Rs. 499', period: '/ month',
                desc: 'For people who are serious about eating smart every single day.',
                features: ['Unlimited AI meal decisions', 'Advanced fridge scanner', 'Full macro tracking', 'Weekly meal planning', 'Grocery list export (PDF)', 'Family mode (up to 8 servings)', 'Ramadan Sehri/Iftar planner', 'Priority AI responses'],
                off: [],
                cta: 'Start 7-Day Free Trial', accent: true, badge: 'Most Popular',
              },
              {
                name: 'Family', amount: 'Rs. 899', period: '/ month',
                desc: 'Built for households managing meals, budgets, and multiple diets.',
                features: ['Everything in Pro', 'Up to 5 family profiles', 'Separate dietary preferences per member', 'Combined weekly grocery list', 'Monthly meal budget report', 'WhatsApp meal reminders'],
                off: [],
                cta: 'Try Family Plan', accent: false,
              },
            ].map((p, i) => (
              <div key={i} className={`price-card ${p.accent ? 'featured' : ''}`}>
                {p.badge && <div className="price-badge-wrap"><span className="price-badge">{p.badge}</span></div>}
                <p className="price-name">{p.name}</p>
                <p className="price-amount">{p.amount} <span>{p.period}</span></p>
                <p className="price-desc">{p.desc}</p>
                <ul className="price-features">
                  {p.features.map((f, j) => <li key={j}>{f}</li>)}
                  {p.off.map((f, j) => <li key={'o' + j} className="off">{f}</li>)}
                </ul>
                <Link to="/demo" className={`btn-price ${p.accent ? 'btn-price-accent' : 'btn-price-outline'}`}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: 'var(--surface)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p className="section-label">FAQ</p>
          <h2 className="section-title centered">Got questions?</h2>
          <p className="section-sub centered">Everything you need to know about MealMind.</p>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className={`faq-item ${faqOpen === i ? 'open' : ''}`}>
                <button className="faq-q" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                  <span>{faq.q}</span>
                  <span className={`faq-icon ${faqOpen === i ? 'open' : ''}`}>+</span>
                </button>
                <div className={`faq-body ${faqOpen === i ? 'open' : ''}`}>
                  <div className="faq-inner">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="cta-box">
          <h2 className="cta-title">What are you eating tonight?<br />Let MealMind decide. 🍛</h2>
          <p className="cta-sub">Join 50,000+ households who've replaced daily food stress with a 10-second AI decision. Free to start, no card required.</p>
          <div className="cta-btns">
            <Link to="/demo" className="btn-main">Start Eating Smarter 🚀</Link>
            <Link to="/login" className="btn-ghost">Log Into Account</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-grid">
          <div>
            <a href="#" className="footer-logo">Meal<span>Mind</span></a>
            <p className="footer-desc">Pakistan's first AI-powered meal planner. Reducing daily food decision fatigue one meal at a time — from Karachi to Khyber.</p>
            <div className="footer-socials">
              {[['𝕏', '#'], ['in', '#'], ['▶', '#'], ['📘', '#']].map(([icon, href], i) => (
                <a key={i} href={href} className="social-btn">{icon}</a>
              ))}
            </div>
          </div>
          <div>
            <p className="footer-col-title">Product</p>
            <ul className="footer-links">
              {['Features', 'Pricing', 'How It Works', 'Roadmap', 'Changelog'].map(l => <li key={l}><a href="#">{l}</a></li>)}
            </ul>
          </div>
          <div>
            <p className="footer-col-title">Company</p>
            <ul className="footer-links">
              {['About Us', 'Blog', 'Careers', 'Press Kit', 'Contact'].map(l => <li key={l}><a href="#">{l}</a></li>)}
            </ul>
          </div>
          <div>
            <p className="footer-col-title">Support</p>
            <ul className="footer-links">
              {['Help Centre', 'Community', 'Status Page', 'Privacy Policy', 'Terms of Service'].map(l => <li key={l}><a href="#">{l}</a></li>)}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copy">© 2025 MealMind Technologies. Made with ❤️ in Pakistan.</p>
          <div className="footer-legal">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
          </div>
          <div className="footer-badge">🔒 Secured & Trusted</div>
        </div>
      </footer>
    </>
  );
}

/* ── How It Works (tabs for Cook vs Order) ── */
function HowItWorks() {
  const [activeMode, setActiveMode] = useState('cook');

  const cookSteps = [
    { icon: '🧊', label: 'Describe your pantry or what\'s in your fridge', color: '#38bdf8' },
    { icon: '💰', label: 'Set your budget and fitness goals', color: '#a78bfa' },
    { icon: '✨', label: 'Get a perfect recipe to cook instantly', color: '#fb923c' },
  ];
  const orderSteps = [
    { icon: '😋', label: 'Tell us your mood and what you\'re craving', color: '#f472b6' },
    { icon: '📍', label: 'Share your location and budget', color: '#4ade80' },
    { icon: '🛵', label: 'Get the best restaurant and dish to order', color: '#fbbf24' },
  ];

  const steps = activeMode === 'cook' ? cookSteps : orderSteps;

  return (
    <>
      <div className="how-mode-tabs">
        <button className={`how-tab ${activeMode === 'cook' ? 'active' : ''}`} onClick={() => setActiveMode('cook')}>
          🍳 Cook at Home
        </button>
        <button className={`how-tab ${activeMode === 'order' ? 'active' : ''}`} onClick={() => setActiveMode('order')}>
          🛵 Order In
        </button>
      </div>
      <div className="how-flow active">
        {steps.map((s, i) => (
          <div className="how-step" key={i}>
            <div className="step-badge" style={{ borderColor: s.color, color: s.color }}>{i + 1}</div>
            <div className="step-emoji">{s.icon}</div>
            <p className="step-text">{s.label}</p>
          </div>
        ))}
      </div>
    </>
  );
}
