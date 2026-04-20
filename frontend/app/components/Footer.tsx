export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/20 py-12 px-6 md:px-20 mt-20">
      <div className="flex flex-wrap justify-end gap-8 md:gap-12">
        <span className="mr-auto text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-40">
          © 2026 SENTIENTMARKETS.
        </span>
        {['Privacy', 'Terms', 'Contact', 'Legal Disclaimer'].map((link) => (
          <a
            key={link}
            href="#"
            className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-40 hover:text-white transition-colors"
          >
            {link}
          </a>
        ))}
      </div>
    </footer>
  );
}
