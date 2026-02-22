import { Link } from "wouter";
import { ArrowLeft, Gem, Shield, Sparkles } from "lucide-react";

export default function Materials() {
  return (
    <div className="min-h-screen">
      <div className="bg-[oklch(0.97_0.015_350)] py-8 lg:py-12">
        <div className="container">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <h1 className="text-2xl md:text-3xl font-serif font-bold">Nossos Materiais</h1>
          <p className="text-muted-foreground text-sm mt-2">Qualidade e garantia em cada peça</p>
        </div>
      </div>
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border p-6 text-center space-y-3">
            <Gem className="w-8 h-8 mx-auto text-[oklch(0.65_0.12_350)]" />
            <h3 className="font-serif font-bold text-lg">Prata 925</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A prata 925, também conhecida como prata de lei, contém 92,5% de prata pura. Nossas peças vêm com garantia e certificado de autenticidade. Material hipoalergênico e durável.
            </p>
          </div>
          <div className="bg-white rounded-xl border p-6 text-center space-y-3">
            <Sparkles className="w-8 h-8 mx-auto text-[oklch(0.78_0.08_80)]" />
            <h3 className="font-serif font-bold text-lg">Semijoias</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nossas semijoias são banhadas em ouro 18k ou ródio (prata), com camadas generosas que garantem durabilidade e brilho prolongado. Acabamento premium em todas as peças.
            </p>
          </div>
          <div className="bg-white rounded-xl border p-6 text-center space-y-3">
            <Shield className="w-8 h-8 mx-auto text-[oklch(0.65_0.12_350)]" />
            <h3 className="font-serif font-bold text-lg">Aço Inox</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Peças em aço inoxidável de alta qualidade, resistentes à oxidação e ao desgaste. Ideais para uso diário, mantendo o brilho por muito mais tempo.
            </p>
          </div>
        </div>
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <h3 className="font-serif font-bold text-lg mb-3">Cuidados com suas Joias</h3>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li>• Evite contato com perfumes, cremes e produtos químicos</li>
            <li>• Guarde as peças separadamente em saquinhos ou caixinhas</li>
            <li>• Retire as joias antes de dormir, tomar banho ou praticar exercícios</li>
            <li>• Limpe com flanela macia e seca</li>
            <li>• Para pratas, use limpa pratas específico quando necessário</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
