import { Link } from "wouter";
import { Instagram, MessageCircle } from "lucide-react";
import { WHATSAPP_URL } from "@shared/types";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663370743129/SRLuMBLhpOzKodgg.png";

export default function Footer() {
  return (
    <footer className="bg-[oklch(0.15_0.01_60)] text-white/80">
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <img src={LOGO_URL} alt="CLL JOIAS" className="h-16 w-16 rounded-full object-cover brightness-0 invert opacity-80" />
            <p className="text-sm leading-relaxed text-white/60">
              Semi joias banhadas em Ouro e Prata, Pratas 925 com garantia e acessórios personalizados. Enviamos para toda a Bahia.
            </p>
            <div className="flex gap-3">
              <a href="https://instagram.com/cll.joias" target="_blank" rel="noopener" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-serif text-white font-medium mb-4">Categorias</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/categoria/pratas-925" className="hover:text-white transition-colors">Pratas 925</Link></li>
              <li><Link href="/categoria/semi-joias" className="hover:text-white transition-colors">Semi-joias</Link></li>
              <li><Link href="/categoria/relogios" className="hover:text-white transition-colors">Relógios</Link></li>
              <li><Link href="/categoria/personalizados" className="hover:text-white transition-colors">Personalizados</Link></li>
              <li><Link href="/categoria/personalizados-pet" className="hover:text-white transition-colors">Personalizados Pet</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-white font-medium mb-4">Informações</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/materiais" className="hover:text-white transition-colors">Nossos Materiais</Link></li>
              <li><Link href="/catalogo" className="hover:text-white transition-colors">Catálogo Completo</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-white font-medium mb-4">Contato</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener" className="hover:text-white transition-colors">
                  WhatsApp: (71) 99227-3149
                </a>
              </li>
              <li>
                <a href="https://instagram.com/cll.joias" target="_blank" rel="noopener" className="hover:text-white transition-colors">
                  Instagram: @cll.joias
                </a>
              </li>
              <li className="text-white/50">Salvador, BA</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 text-center text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} CLL JOIAS. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
