import { MessageCircle } from "lucide-react";
import { WHATSAPP_URL } from "@shared/types";
import { motion } from "framer-motion";

export default function WhatsAppButton() {
  return (
    <motion.a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1, type: "spring" }}
      className="fixed bottom-6 right-6 z-40 bg-green-500 hover:bg-green-600 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl transition-all"
      title="Fale conosco no WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </motion.a>
  );
}
